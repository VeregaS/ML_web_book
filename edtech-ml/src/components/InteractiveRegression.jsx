import { useEffect, useRef, useCallback } from 'react';
import JXG from 'jsxgraph';
import { usePyodide } from '../hooks/usePyodide';
import { debounce } from '../utils/debounce';
import { useTheme } from '../context/ThemeContext';

export default function InteractiveRegression() {
  const boardRef = useRef(null);
  const boardInstance = useRef(null);
  const pointsRef = useRef([]);
  const lineRef = useRef(null);
  const { runPython, isLoading } = usePyodide();
  const { theme } = useTheme();

  const isDark = theme === 'dark';

  const calculateRegression = useCallback(async () => {
    if (isLoading || !lineRef.current) return;

    const xData = pointsRef.current.map(p => p.X());
    const yData = pointsRef.current.map(p => p.Y());

    const pythonCode = `
import numpy as np
from sklearn.linear_model import LinearRegression

X = np.array(${JSON.stringify(xData)}).reshape(-1, 1)
y = np.array(${JSON.stringify(yData)})

model = LinearRegression().fit(X, y)
x_range = np.array([[0], [10]])
y_pred = model.predict(x_range)
list(y_pred)
`;

    try {
      const { result } = await runPython(pythonCode);
      if (result && lineRef.current) {
        const [yStart, yEnd] = JSON.parse(result.replace(/'/g, '"'));
        lineRef.current.point1.moveTo([0, yStart], 100);
        lineRef.current.point2.moveTo([10, yEnd], 100);
      }
    } catch (err) {
      console.error("Regression error:", err);
    }
  }, [runPython, isLoading]);

  const debouncedCalculate = useCallback(debounce(calculateRegression, 100), [calculateRegression]);

  useEffect(() => {
    if (!boardRef.current) return;

    if (boardInstance.current) {
      JXG.JSXGraph.freeBoard(boardInstance.current);
    }

    const board = JXG.JSXGraph.initBoard(boardRef.current.id, {
      boundingbox: [-1, 11, 11, -1],
      axis: true,
      showCopyright: false,
      resize: { enabled: false },
      defaultAxes: {
        x: { strokeColor: isDark ? '#475569' : '#cbd5e1', label: { color: isDark ? '#94a3b8' : '#64748b' } },
        y: { strokeColor: isDark ? '#475569' : '#cbd5e1', label: { color: isDark ? '#94a3b8' : '#64748b' } }
      }
    });

    boardInstance.current = board;

    const initialPoints = [[2, 3], [4, 5], [6, 4], [8, 8], [5, 2]];

    pointsRef.current = initialPoints.map(([x, y], i) => {
      const p = board.create('point', [x, y], {
        name: ``,
        color: isDark ? '#818CF8' : '#4F39F6',
        size: 5,
        snapToGrid: false
      });
      p.on('drag', debouncedCalculate);
      return p;
    });

    const p1 = board.create('point', [0, 0], { visible: false });
    const p2 = board.create('point', [10, 0], { visible: false });
    lineRef.current = board.create('line', [p1, p2], {
      strokeColor: '#ef4444',
      strokeWidth: 3,
      dash: 2
    });

    calculateRegression();

    return () => JXG.JSXGraph.freeBoard(board);
  }, [theme]);

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-[var(--bg-subpanel)] p-5 rounded-xl border border-[var(--border-main)] transition-colors">
        <div>
          <h3 className="text-[11px] font-bold text-[var(--text-bright)] uppercase tracking-widest mb-1">Живая Линейная Регрессия</h3>
          <p className="text-[11px] text-[var(--text-muted)] font-medium leading-tight">Перетаскивайте точки — линия тренда пересчитается автоматически.</p>
        </div>
        {isLoading && <span className="text-[9px] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] px-3 py-1 rounded-full animate-pulse font-black uppercase tracking-widest">Calculations...</span>}
      </div>
      <div 
        id="regression-board" 
        ref={boardRef} 
        className="w-full h-96 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl shadow-inner overflow-hidden transition-colors"
      />
    </div>
  );
}
