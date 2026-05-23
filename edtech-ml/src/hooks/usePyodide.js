import { useState, useEffect, useCallback } from 'react';

/**
 * Менеджер для управления Web Worker с Pyodide.
 * Инкапсулирует логику инициализации, обмена сообщениями и прерывания.
 */
class PyodideManager {
  constructor() {
    this.worker = null;
    this.isReady = false;
    this.messageCallbacks = new Map();
    this.messageIdCounter = 0;
    this.listeners = new Set();
  }

  init() {
    if (this.worker) return;

    this.worker = new Worker(new URL('../workers/pyodideWorker.js', import.meta.url));
    this.isReady = false;

    this.worker.onmessage = (e) => {
      const { type, id, result, output, error, y_start, y_end } = e.data;

      if (type === 'READY') {
        this.isReady = true;
        this.notify(true);
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
          callback.resolve({ result, output, plots: e.data.plots });
        }
        this.messageCallbacks.delete(id);
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

  runPython(code, testCode = null) {
    return new Promise((resolve, reject) => {
      if (!this.worker || !this.isReady) {
        return reject(new Error("Среда еще загружается..."));
      }

      const id = this.messageIdCounter++;
      this.messageCallbacks.set(id, { resolve, reject });
      this.worker.postMessage({ id, code, testCode });
    });
  }

  interrupt() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isReady = false;
      
      this.messageCallbacks.forEach(cb => 
        cb.reject(new Error("Выполнение принудительно остановлено."))
      );
      this.messageCallbacks.clear();
      
      this.notify(false);
      this.init(); 
    }
  }
}

// Singleton экземпляр
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

  const runPython = useCallback((code) => manager.runPython(code), []);
  const interrupt = useCallback(() => manager.interrupt(), []);

  return { isLoading: !isReady, runPython, interrupt };
};
