import { useState, useEffect, useCallback } from 'react';

// Singleton-состояние вне компонента
let worker = null;
let isReady = false;
let messageCallbacks = {};
let messageIdCounter = 0;
const readyListeners = new Set();

const initWorker = () => {
  if (worker) return worker;

  // Инициализация Web Worker через синтаксис Vite
  worker = new Worker(new URL('../workers/pyodideWorker.js', import.meta.url));
  isReady = false;

  worker.onmessage = (e) => {
    const { type, id, result, output, error, y_start, y_end } = e.data;

    if (type === 'READY') {
      isReady = true;
      readyListeners.forEach(fn => fn(true));
      return;
    }

    if (type === 'UPDATE_LINE') {
      // Вызываем глобальную функцию JSXGraph
      if (window.updateLine) window.updateLine(y_start, y_end);
      return;
    }

    if (messageCallbacks[id]) {
      if (type === 'ERROR') {
        messageCallbacks[id].reject(new Error(error));
      } else {
        messageCallbacks[id].resolve({ result, output, plots: e.data.plots });
      }
      delete messageCallbacks[id];
    }
  };

  return worker;
};

export const usePyodide = () => {
  const [isLoading, setIsLoading] = useState(!isReady);

  useEffect(() => {
    initWorker();
    
    const handleReady = (readyStatus) => setIsLoading(!readyStatus);
    readyListeners.add(handleReady);
    setIsLoading(!isReady); // Синхронизируем состояние

    return () => {
      readyListeners.delete(handleReady);
    };
  }, []);

  const runPython = useCallback((code) => {
    return new Promise((resolve, reject) => {
      if (!worker || !isReady) return reject(new Error("Среда еще загружается..."));

      const id = messageIdCounter++;
      messageCallbacks[id] = { resolve, reject };
      worker.postMessage({ id, code });
    });
  }, []);

  const interrupt = useCallback(() => {
    if (worker) {
      worker.terminate(); // Жестко убиваем поток
      worker = null;
      isReady = false;
      
      // Отклоняем все зависшие промисы
      Object.values(messageCallbacks).forEach(cb => 
        cb.reject(new Error("Выполнение принудительно остановлено."))
      );
      messageCallbacks = {};
      
      // Уведомляем UI и запускаем новый Worker
      readyListeners.forEach(fn => fn(false));
      initWorker(); 
    }
  }, []);

  return { isLoading, runPython, interrupt };
};