// src/workers/pyodideWorker.js
importScripts('https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js');

let currentInterruptBuffer = null;

async function init() {
  self.pyodide = await loadPyodide({
    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/'
  });
  
  self.currentPlots = [];

  // Регистрируем функцию для графиков
  self.pyodide.globals.set("sendPlotToMain", (base64_str) => {
    self.currentPlots.push(base64_str);
  });

  // Функция для передачи метрик обучения в реальном времени
  self.pyodide.globals.set("sendMetricToMain", (epoch, loss) => {
    self.postMessage({ type: 'METRIC', epoch, loss });
  });

  self.postMessage({ type: 'READY' });
}

const readyPromise = init();

self.onmessage = async (event) => {
  if (event.data.type === 'INIT') {
    if (event.data.interruptBuffer) {
      currentInterruptBuffer = event.data.interruptBuffer;
      self.pyodide.setInterruptBuffer(currentInterruptBuffer);
    }
    return;
  }

  await readyPromise;
  const { id, code, testCode } = event.data;
  
  // Настраиваем стриминг для текущего запроса
  self.pyodide.setStdout({
    batched: (msg) => {
      self.postMessage({ type: 'STDOUT', id, output: msg + "\n" });
    }
  });
  
  try {
    // 1. Загрузка пакетов
    const packagesToLoad = [];
    const fullCode = code + (testCode || "");
    
    if (fullCode.includes('numpy')) packagesToLoad.push('numpy');
    if (fullCode.includes('matplotlib')) packagesToLoad.push('matplotlib');
    if (fullCode.includes('scipy')) packagesToLoad.push('scipy');
    if (fullCode.includes('pandas')) packagesToLoad.push('pandas');
    if (fullCode.includes('sklearn') || fullCode.includes('scikit')) packagesToLoad.push('scikit-learn');

    if (packagesToLoad.length > 0) {
      await self.pyodide.loadPackage(packagesToLoad);
    }
    await self.pyodide.loadPackagesFromImports(fullCode);

    // 2. Изоляция пространства имен
    const clearGlobalsCode = `
import sys
_keep = {'sys', 'np', 'pd', 'plt', 'sklearn', 'sendPlotToMain', 'sendMetricToMain', '_stdout'}
for _k in list(globals().keys()):
    if not _k.startswith('__') and _k not in _keep:
        try:
            del globals()[_k]
        except:
            pass
`;
    await self.pyodide.runPythonAsync(clearGlobalsCode);
    
    // 3. Патч Matplotlib
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
    let result = await self.pyodide.runPythonAsync(code);
    
    // 5. Проверка на DataFrame
    let isDataFrame = false;
    let dfJson = null;
    
    if (result !== undefined && result.type === 'DataFrame') {
      isDataFrame = true;
      self.pyodide.globals.set('_last_df', result);
      dfJson = JSON.parse(await self.pyodide.runPythonAsync(`_last_df.to_json(orient="records")`));
      result.destroy();
      result = "DataFrame [Инспектор датасета]";
    } else if (result !== undefined) {
      const resStr = String(result);
      if (result.destroy) result.destroy();
      result = resStr;
    }

    // 6. Выполнение Unit-тестов
    let testResults = null;
    if (testCode) {
      // Сохраняем код в виртуальную файловую систему
      self.pyodide.FS.writeFile('student_code.py', code);
      self.pyodide.FS.writeFile('test_code.py', testCode);
      
      const runnerCode = `
import unittest
import test_code
import json
import io
import sys

# Перезагружаем модули, чтобы изменения подтянулись
if 'student_code' in sys.modules:
    del sys.modules['student_code']
if 'test_code' in sys.modules:
    del sys.modules['test_code']

import test_code

suite = unittest.TestLoader().loadTestsFromModule(test_code)
stream = io.StringIO()
runner = unittest.TextTestRunner(stream=stream, verbosity=2)
res = runner.run(suite)

json.dumps({
    "wasSuccessful": res.wasSuccessful(),
    "errors": [str(e[1]) for e in res.errors],
    "failures": [str(f[1]) for f in res.failures],
    "output": stream.getvalue()
})
`;
      const testJson = await self.pyodide.runPythonAsync(runnerCode);
      testResults = JSON.parse(testJson);
    }
    
    self.postMessage({ 
      type: 'RESULT', 
      id, 
      result, 
      plots: self.currentPlots,
      isDataFrame,
      testResults,
      dfData: dfJson
    });
  } catch (err) {
    self.postMessage({ type: 'ERROR', id, error: err.message });
  }
};
