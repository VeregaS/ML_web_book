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
  const { id, code } = event.data;
  
  try {
    const packagesToLoad = [];
    if (code.includes('numpy')) packagesToLoad.push('numpy');
    if (code.includes('matplotlib')) packagesToLoad.push('matplotlib');
    if (code.includes('scipy')) packagesToLoad.push('scipy');
    if (code.includes('pandas')) packagesToLoad.push('pandas');

    if (packagesToLoad.length > 0) {
      await self.pyodide.loadPackage(packagesToLoad);
    }
    // И все равно запускаем авто-анализатор для остальных
    await self.pyodide.loadPackagesFromImports(code);
    
    // 2. В патче вызываем функцию напрямую, так как она уже в globals
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
    let output = "";
    self.pyodide.setStdout({ batched: (msg) => { output += msg + "\n"; } });
    
    const result = await self.pyodide.runPythonAsync(code);
    
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