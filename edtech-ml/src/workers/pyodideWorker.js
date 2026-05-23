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

    // 2. Изоляция пространства имен (Hard Reset)
    const clearGlobalsCode = `
import sys
import importlib

# Список системных модулей и функций, которые нельзя удалять
_keep = {'sys', 'np', 'pd', 'plt', 'sklearn', 'sendPlotToMain', 'sendMetricToMain', '_stdout', 'importlib', 're', 'unittest', 'json', 'io'}

# Удаляем все пользовательские переменные
for _k in list(globals().keys()):
    if not _k.startswith('__') and _k not in _keep:
        try:
            del globals()[_k]
        except:
            pass

# Принудительно выгружаем модули, если они были загружены ранее
for mod in ['student_code', 'test_code']:
    if mod in sys.modules:
        del sys.modules[mod]
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
      self.pyodide.FS.writeFile('student_code.py', code);
      self.pyodide.FS.writeFile('test_code.py', testCode);
      
      const runnerCode = `
import unittest
import json
import io
import sys
import re
import importlib

try:
    import student_code
    import test_code
    importlib.reload(student_code)
    importlib.reload(test_code)
except Exception:
    pass

suite = unittest.TestLoader().loadTestsFromModule(test_code)
stream = io.StringIO()
runner = unittest.TextTestRunner(stream=stream, verbosity=0)
res = runner.run(suite)

# Стандартизированный LeetCode-вывод
formatted_output = ""
if not res.wasSuccessful():
    formatted_output += "\\n" + "-"*30 + "\\n"
    formatted_output += " \\u2716 \\u0422\\u0415\\u0421\\u0422\\u042b \\u041d\\u0415 \\u041f\\u0420\\u041e\\u0419\\u0414\\u0415\\u041d\\u042b\\n"
    formatted_output += "-"*30 + "\\n"
    
    for failure in res.failures + res.errors:
        err_msg = str(failure[1])
        
        # Обработка TypeError (возникает если функция вернула None в np.testing)
        if "TypeError: ufunc 'isfinite'" in err_msg or "NoneType" in err_msg:
             formatted_output += "\\u041e\\u0448\\u0438\\u0431\\u043a\\u0430: \\u0424\\u0443\\u043d\\u043a\\u0446\\u0438\\u044f \\u0432\\u0435\\u0440\\u043d\\u0443\\u043b\\u0430 None \\u0432\\u043c\\u0435\\u0441\\u0442\\u043e \\u0447\\u0438\\u0441\\u043b\\u0430/\\u043c\\u0430\\u0441\\u0441\\u0438\\u0432\\u0430\\n"
             continue

        # 1. Поиск математической ошибки (Expected vs Actual)
        match = re.search(r"AssertionError: (.*?) (!=|is not|is|==) (.*)", err_msg)
        if not match:
            # Паттерн assertAlmostEqual
            match = re.search(r"AssertionError: (.*?) != (.*?) within (.*?) places", err_msg)
            
        is_numpy_error = False
        if not match:
            # Паттерн numpy
            match = re.search(r"Actual: (.*?)\\nExpected: (.*)", err_msg, re.DOTALL)
            is_numpy_error = True
            
        if match:
            try:
                if is_numpy_error:
                    actual = match.group(1).strip()
                    expected = match.group(2).strip()
                else:
                    actual = match.group(1).strip()
                    expected = match.group(3).strip() if match.lastindex >= 3 else match.group(2).strip()

                formatted_output += f"\\u041e\\u0436\\u0438\\u0434\\u0430\\u043b\\u043e\\u0441\\u044c:  {expected}\\n"
                formatted_output += f"\\u041f\\u043e\\u043b\\u0443\\u0447\\u0435\\u043d\\u043e:   {actual}\\n"
            except:
                err_line = err_msg.split('\\n')[-1]
                formatted_output += f"\\u2716 \\u041e\\u0448\\u0438\\u0431\\u043a\\u0430: {err_line}\\n"
        else:
            # 2. Поиск структурной ошибки
            if "AttributeError" in err_msg:
                attr_match = re.search(r"has no attribute '(.*?)'", err_msg)
                missing = attr_match.group(1) if attr_match else "item"
                formatted_output += f"\\u26a0\\ufe0f \\u041e\\u0448\\u0438\\u0431\\u043a\\u0430: \\u041d\\u0435 \\u043d\\u0430\\u0439\\u0434\\u0435\\u043d\\u0430 \\u0444\\u0443\\u043d\\u043a\\u0446\\u0438\\u044f '{missing}'\\n"
            else:
                last_line = err_msg.split('\\n')[-1]
                formatted_output += f"\\u2716 \\u041e\\u0448\\u0438\\u0431\\u043a\\u0430: {last_line}\\n"
            
    formatted_output += "-"*30 + "\\n"
else:
    formatted_output += "\\n" + "-"*30 + "\\n"
    formatted_output += " \\u2705 \\u0423\\u0421\\u041f\\u0415\\u0425: \\u0412\\u0421\\u0415 \\u0422\\u0415\\u0421\\u0422\\u042b \\u041f\\u0420\\u041e\\u0419\\u0414\\u0415\\u041d\\u042b\\n"
    formatted_output += "-"*30 + "\\n"

json.dumps({
    "wasSuccessful": res.wasSuccessful(),
    "output": formatted_output
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
