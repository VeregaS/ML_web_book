// src/workers/pyodideWorker.js
importScripts('https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js');

async function init() {
  self.pyodide = await loadPyodide({
    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/'
  });
  
  self.currentPlots = [];

  // Регистрируем функцию для графиков
  self.pyodide.globals.set("sendPlotToMain", (base64_str) => {
    self.currentPlots.push(base64_str);
  });

  // Настройка стриминга stdout
  // Перехватываем каждый чанк текста и отправляем в основной поток
  self.pyodide.setStdout({
    batched: (msg) => {
      self.postMessage({ type: 'STDOUT', output: msg });
    }
  });

  self.postMessage({ type: 'READY' });
}

const readyPromise = init();

self.onmessage = async (event) => {
  await readyPromise;
  const { id, code, testCode } = event.data;
  
  try {
    // 1. Предварительная загрузка тяжелых пакетов
    const packagesToLoad = [];
    const fullCode = code + (testCode || "");
    
    if (fullCode.includes('numpy')) packagesToLoad.push('numpy');
    if (fullCode.includes('matplotlib')) packagesToLoad.push('matplotlib');
    if (fullCode.includes('scipy')) packagesToLoad.push('scipy');
    if (fullCode.includes('pandas')) packagesToLoad.push('pandas');
    if (fullCode.includes('sklearn')) packagesToLoad.push('scikit-learn');

    if (packagesToLoad.length > 0) {
      await self.pyodide.loadPackage(packagesToLoad);
    }
    await self.pyodide.loadPackagesFromImports(fullCode);

    // 2. Изоляция пространства имен (Namespace Isolation)
    // Удаляем всё, кроме системных модулей и наших спец-функций
    const clearGlobalsCode = `
import sys
_keep = {'sys', 'np', 'pd', 'plt', 'sklearn', 'sendPlotToMain', '_stdout'}
for _k in list(globals().keys()):
    if not _k.startswith('__') and _k not in _keep:
        try:
            del globals()[_k]
        except:
            pass
`;
    await self.pyodide.runPythonAsync(clearGlobalsCode);
    
    // 3. Патч Matplotlib для работы в Web Worker
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
except ImportError:
    pass
`;
    await self.pyodide.runPythonAsync(patchCode);
    
    self.currentPlots = [];
    
    // 4. Выполнение основного кода
    const result = await self.pyodide.runPythonAsync(code);
    
    // 5. Выполнение тестов (если переданы)
    if (testCode) {
      await self.pyodide.runPythonAsync(testCode);
    }
    
    self.postMessage({ 
      type: 'RESULT', 
      id, 
      result: result !== undefined ? String(result) : undefined, 
      plots: self.currentPlots
    });
  } catch (err) {
    self.postMessage({ type: 'ERROR', id, error: err.message });
  }
};
