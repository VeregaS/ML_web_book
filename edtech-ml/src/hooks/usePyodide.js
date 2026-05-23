import { useState, useEffect, useCallback } from 'react';

/**
 * Менеджер для управления Web Worker с Pyodide.
 * Инкапсулирует логику инициализации, обмена сообщениями, таймаутов и прерывания.
 */
class PyodideManager {
  constructor() {
    this.worker = null;
    this.isReady = false;
    this.messageCallbacks = new Map();
    this.messageIdCounter = 0;
    this.listeners = new Set();
    
    this.activeStdoutCallback = null;
    this.activeMetricCallback = null;
    
    this.interruptBuffer = null;
    // SharedArrayBuffer требуется для прерывания бесконечных циклов в Pyodide
    if (typeof SharedArrayBuffer !== 'undefined') {
      this.interruptBuffer = new Uint8Array(new SharedArrayBuffer(1));
    }
  }

  init() {
    if (this.worker) return;

    this.worker = new Worker(new URL('../workers/pyodideWorker.js', import.meta.url));
    this.isReady = false;

    // Передаем буфер сразу при инициализации
    this.worker.postMessage({ type: 'INIT', interruptBuffer: this.interruptBuffer });

    this.worker.onmessage = (e) => {
      const { type, id, result, output, error, y_start, y_end, epoch, loss, isDataFrame, testResults } = e.data;

      if (type === 'READY') {
        this.isReady = true;
        this.notify(true);
        return;
      }

      if (type === 'STDOUT') {
        if (this.activeStdoutCallback) {
          this.activeStdoutCallback(output);
        }
        return;
      }

      if (type === 'METRIC') {
        if (this.activeMetricCallback) {
          this.activeMetricCallback({ epoch, loss });
        }
        return;
      }

      if (type === 'UPDATE_LINE') {
        if (window.updateLine) window.updateLine(y_start, y_end);
        return;
      }

      const callback = this.messageCallbacks.get(id);
      if (callback) {
        if (type === 'ERROR') {
          callback.reject(new Error(error));
        } else {
          callback.resolve({ result, plots: e.data.plots, isDataFrame, testResults });
        }
        
        clearTimeout(callback.timer);
        this.messageCallbacks.delete(id);
        this.activeStdoutCallback = null;
        this.activeMetricCallback = null;
      }
    };

    this.worker.onerror = (e) => {
      console.error('Pyodide Worker Error:', e);
      this.notify(false);
    };
  }

  addListener(fn) {
    this.listeners.add(fn);
    fn(this.isReady);
  }

  removeListener(fn) {
    this.listeners.delete(fn);
  }

  notify(status) {
    this.listeners.forEach(fn => fn(status));
  }

  runPython(code, testCode = null, onStdout = null, onMetric = null) {
    return new Promise((resolve, reject) => {
      if (!this.worker || !this.isReady) {
        return reject(new Error("Среда еще загружается..."));
      }

      const id = this.messageIdCounter++;
      this.activeStdoutCallback = onStdout;
      this.activeMetricCallback = onMetric;
      
      // Сбрасываем флаг прерывания
      if (this.interruptBuffer) {
        this.interruptBuffer[0] = 0;
      }

      // Устанавливаем таймаут 10 секунд для защиты от бесконечных циклов
      const timer = setTimeout(() => {
        if (this.interruptBuffer) {
          // Отправляем сигнал KeyboardInterrupt в Pyodide
          this.interruptBuffer[0] = 2;
          // Отклоняем промис
          reject(new Error("Таймаут (10с): возможно, код ушел в бесконечный цикл. Выполнение прервано."));
        } else {
          // Fallback, если SAB не поддерживается браузером
          this.interrupt();
          reject(new Error("Таймаут (10с): выполнение прервано жестким перезапуском воркера."));
        }
      }, 10000);

      this.messageCallbacks.set(id, { resolve, reject, timer });
      this.worker.postMessage({ id, code, testCode });
    });
  }

  interrupt() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isReady = false;
      
      this.messageCallbacks.forEach(cb => {
        clearTimeout(cb.timer);
        cb.reject(new Error("Выполнение принудительно остановлено."));
      });
      this.messageCallbacks.clear();
      this.activeStdoutCallback = null;
      this.activeMetricCallback = null;
      
      this.notify(false);
      this.init(); 
    }
  }
}

const manager = new PyodideManager();

export const usePyodide = () => {
  const [isReady, setIsReady] = useState(manager.isReady);

  useEffect(() => {
    manager.init();
    
    const handleReadyChange = (readyStatus) => setIsReady(readyStatus);
    manager.addListener(handleReadyChange);

    return () => {
      manager.removeListener(handleReadyChange);
    };
  }, []);

  const runPython = useCallback((code, testCode, onStdout, onMetric) => 
    manager.runPython(code, testCode, onStdout, onMetric), []);
    
  const interrupt = useCallback(() => manager.interrupt(), []);

  return { isLoading: !isReady, runPython, interrupt };
};
