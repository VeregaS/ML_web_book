import { useEffect, useRef, useCallback } from 'react';
import JXG from 'jsxgraph';
import { usePyodide } from '../hooks/usePyodide';
import { debounce } from '../utils/debounce';

export default function InteractiveRegression() {
  const boardRef = useRef(null);
  const boardInstance = useRef(null);
  const pointsRef = useRef([]);
  const lineRef = useRef(null);
  const { runPython, isLoading } = usePyodide();

  // Функция для расчета регрессии через Pyodide
  const calculateRegression = useCallback(async () => {
    if (isLoading) return;

    // Собираем координаты точек
    const xData = pointsRef.current.map(p => p.X());
    const yData = pointsRef.current.map(p => p.Y());

    const pythonCode = `
import numpy as np
from sklearn.linear_model import LinearRegression

X = np.array(${JSON.stringify(xData)}).reshape(-1, 1)
y = np.array(${JSON.stringify(yData)})

model = LinearRegression().fit(X, y)
# Предсказываем значения для краев графика (x=0 и x=10)
x_range = np.array([[0], [10]])
y_pred = model.predict(x_range)
list(y_pred)
`;

    try {
      const { result } = await runPython(pythonCode);
      if (result && lineRef.current) {
        const [yStart, yEnd] = JSON.parse(result.replace(/'/g, '"'));
        // Анимируем перемещение линии
        lineRef.current.point1.moveTo([0, yStart], 100);
        lineRef.current.point2.moveTo([10, yEnd], 100);
      }
    } catch (err) {
      console.error("Regression error:", err);
    }
  }, [runPython, isLoading]);

  // Оборачиваем в debounce для плавности (100мс)
  const debouncedCalculate = useCallback(debounce(calculateRegression, 100), [calculateRegression]);

  useEffect(() => {
    if (!boardRef.current) return;

    const board = JXG.JSXGraph.initBoard(boardRef.current.id, {
      boundingbox: [-1, 11, 11, -1],
      axis: true,
      showCopyright: false,
      resize: { enabled: false }
    });

    boardInstance.current = board;

    // Создаем начальные интерактивные точки
    const initialPoints = [
      [2, 3], [4, 5], [6, 4], [8, 8], [5, 2]
    ];

    pointsRef.current = initialPoints.map(([x, y], i) => {
      const p = board.create('point', [x, y], {
        name: `P${i+1}`,
        color: '#2563eb',
        size: 5,
        snapToGrid: false
      });
      
      p.on('drag', debouncedCalculate);
      return p;
    });

    // Создаем линию регрессии (пока пустую)
    const p1 = board.create('point', [0, 0], { visible: false });
    const p2 = board.create('point', [10, 0], { visible: false });
    lineRef.current = board.create('line', [p1, p2], {
      strokeColor: '#ef4444',
      strokeWidth: 3,
      dash: 2
    });

    // Первый расчет
    calculateRegression();

    return () => {
      JXG.JSXGraph.freeBoard(board);
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Живая Линейная Регрессия</h3>
          <p className="text-sm text-slate-500">Перетаскивайте синие точки — красная линия тренда пересчитается через scikit-learn.</p>
        </div>
        {isLoading && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full animate-pulse font-bold">Pyodide Loading...</span>}
      </div>
      <div 
        id="regression-board" 
        ref={boardRef} 
        className="w-full bg-white border border-slate-200 rounded-3xl shadow-inner overflow-hidden"
        style={{ height: '400px' }} 
      />
    </div>
  );
}
