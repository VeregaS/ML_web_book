// src/workers/pyodideWorker.js
importScripts('https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js');

async function init() {
  self.pyodide = await loadPyodide({
    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/'
  });
  
  self.currentPlots = [];

  // 1. Регистрируем функцию в глобальном пространстве Python
  self.pyodide.globals.set("sendPlotToMain", (base64_str) => {
    self.currentPlots.push(base64_str);
  });

  self.postMessage({ type: 'READY' });
}

const readyPromise = init();

self.onmessage = async (event) => {
  await readyPromise;
  const { id, code, testCode } = event.data;
  
  try {
    const packagesToLoad = [];
    const fullCodeForImports = code + (testCode || "");
    if (fullCodeForImports.includes('numpy')) packagesToLoad.push('numpy');
    if (fullCodeForImports.includes('matplotlib')) packagesToLoad.push('matplotlib');
    if (fullCodeForImports.includes('scipy')) packagesToLoad.push('scipy');
    if (fullCodeForImports.includes('pandas')) packagesToLoad.push('pandas');
    if (fullCodeForImports.includes('sklearn')) packagesToLoad.push('scikit-learn');

    if (packagesToLoad.length > 0) {
      await self.pyodide.loadPackage(packagesToLoad);
    }
    await self.pyodide.loadPackagesFromImports(fullCodeForImports);

    // Очистка
    await self.pyodide.runPythonAsync(`
for _k in list(globals().keys()):
    if not _k.startswith('__') and _k != 'sendPlotToMain':
        try: del globals()[_k]
        except: pass
`);
    
    // Патч matplotlib
    const patchCode = `
try:
    import matplotlib
    matplotlib.use('agg')
    import matplotlib.pyplot as plt
    import io, base64
    def _custom_show(*args, **kwargs):
        fig = plt.gcf()
        buf = io.BytesIO()
        fig.savefig(buf, format='png', bbox_inches='tight', dpi=100)
        buf.seek(0)
        sendPlotToMain(base64.b64encode(buf.read()).decode('utf-8'))
        plt.clf()
        plt.close('all')
    plt.show = _custom_show
except: pass
`;
    await self.pyodide.runPythonAsync(patchCode);
    
    self.currentPlots = [];
    let output = "";
    self.pyodide.setStdout({ batched: (msg) => { output += msg + "\n"; } });
    
    // 1. ВЫПОЛНЯЕМ КОД ПОЛЬЗОВАТЕЛЯ
    const result = await self.pyodide.runPythonAsync(code);
    
    // 2. СИНХРОНИЗИРУЕМ ВЫВОД ДЛЯ ТЕСТОВ
    self.pyodide.globals.set("_stdout", output);
    
    // 3. ВЫПОЛНЯЕМ ТЕСТЫ, ЕСЛИ ОНИ ЕСТЬ
    if (testCode) {
      await self.pyodide.runPythonAsync(testCode);
    }
    
    self.postMessage({ 
      type: 'RESULT', 
      id, 
      result: result !== undefined ? String(result) : undefined, 
      output,
      plots: self.currentPlots
    });
  } catch (err) {
    self.postMessage({ type: 'ERROR', id, error: err.message });
  }
};