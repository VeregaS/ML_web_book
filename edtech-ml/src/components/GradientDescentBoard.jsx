import { useEffect, useRef, useState, useCallback } from 'react';
import JXG from 'jsxgraph';
import { usePyodide } from '../hooks/usePyodide';
import { debounce } from '../utils/debounce';
import { useTheme } from '../context/ThemeContext';

export default function GradientDescentBoard() {
  const boardRef = useRef(null);
  const boardInstance = useRef(null);
  const startPointRef = useRef(null);
  const pathRef = useRef(null);
  const [lr, setLr] = useState(0.1);
  const { runPython, isLoading } = usePyodide();
  const { theme } = useTheme();

  const isDark = theme === 'dark';

  const runDescent = useCallback(async (x0, y0, currentLr) => {
    if (isLoading || !boardInstance.current) return;

    const pythonCode = `
import numpy as np
def f(x, y): return x**2 + 2*y**2
def df(x, y): return np.array([2*x, 4*y])
x, y = ${x0}, ${y0}
lr = ${currentLr}
history = [[float(x), float(y)]]
for _ in range(15):
    grad = df(x, y)
    x -= lr * grad[0]
    y -= lr * grad[1]
    history.append([float(x), float(y)])
history
`;

    try {
      const { result } = await runPython(pythonCode);
      let points = JSON.parse(result.replace(/'/g, '"'));
      if (!boardInstance.current) return;
      if (pathRef.current) {
        boardInstance.current.removeObject(pathRef.current);
        pathRef.current = null;
      }
      
      // Путь градиентного спуска
      pathRef.current = boardInstance.current.create('curve', [
        points.map(p => p[0]),
        points.map(p => p[1])
      ], { 
        strokeColor: isDark ? '#818CF8' : '#6366f1', 
        strokeWidth: 4, 
        strokeOpacity: 0.9 
      });
    } catch (err) {
      console.error("GD calculation error:", err);
    }
  }, [runPython, isLoading, isDark]);

  const debouncedRun = useCallback(debounce((x, y, l) => runDescent(x, y, l), 50), [runDescent]);

  useEffect(() => {
    if (!boardRef.current) return;

    const boardId = `gd-board-${Math.random().toString(36).substr(2, 9)}`;
    boardRef.current.id = boardId;

    const board = JXG.JSXGraph.initBoard(boardId, {
      boundingbox: [-5, 5, 5, -5],
      axis: true,
      showCopyright: false,
      resize: { enabled: false },
      defaultAxes: {
        x: { 
          strokeColor: isDark ? '#475569' : '#94a3b8', 
          label: { 
            color: isDark ? '#F8FAFC' : '#1e293b',
            fontSize: 12,
            fontWeight: 'bold'
          } 
        },
        y: { 
          strokeColor: isDark ? '#475569' : '#94a3b8', 
          label: { 
            color: isDark ? '#F8FAFC' : '#1e293b',
            fontSize: 12,
            fontWeight: 'bold'
          } 
        }
      }
    });
    boardInstance.current = board;

    // Контуры функции потерь
    for (let r = 1; r <= 5; r++) {
      board.create('ellipse', [[0, 0], [r, 0], [0, r/Math.sqrt(2)]], {
        strokeColor: isDark ? '#1E293B' : '#e2e8f0', 
        strokeWidth: 1.5,
        dash: 2,
        fixed: true,
        fillOpacity: 0
      });
    }

    // Начальная точка
    const p = board.create('point', [3, 4], {
      name: 'START',
      color: isDark ? '#F8FAFC' : '#4f46e5',
      size: 5,
      label: { color: isDark ? '#F8FAFC' : '#4f46e5', fontWeight: 'bold' }
    });
    startPointRef.current = p;
    p.on('drag', () => debouncedRun(p.X(), p.Y(), lr));

    const colorFixer = () => {
      if (!boardRef.current) return;
      const texts = boardRef.current.querySelectorAll('text, tspan');
      const targetColor = isDark ? '#F8FAFC' : '#1e293b';
      texts.forEach(t => {
        t.setAttribute('fill', targetColor);
        t.style.fill = targetColor;
        t.setAttribute('stroke', 'none');
        t.style.stroke = 'none';
      });
    };

    colorFixer();
    const t1 = setTimeout(colorFixer, 50);
    const t2 = setTimeout(colorFixer, 200);
    const t3 = setTimeout(colorFixer, 500);

    runDescent(3, 4, lr);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      if (boardInstance.current) {
        JXG.JSXGraph.freeBoard(boardInstance.current);
        boardInstance.current = null;
      }
    };
  }, [theme]);

  useEffect(() => {
    if (startPointRef.current && boardInstance.current) {
      runDescent(startPointRef.current.X(), startPointRef.current.Y(), lr);
    }
  }, [lr, runDescent]);

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-[var(--bg-subpanel)] p-5 rounded-xl border border-[var(--border-main)] transition-colors">
        <div className="flex-1">
          <h4 className="text-[11px] font-bold text-[var(--text-bright)] uppercase tracking-widest mb-1">Градиентный спуск</h4>
          <p className="text-[11px] text-[var(--text-muted)] font-medium leading-tight">Перетащите точку START или измените шаг (LR).</p>
        </div>
        <div className="flex flex-col items-end gap-2 w-48 shrink-0">
          <div className="flex justify-between w-full">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Learning Rate</span>
            <span className="text-xs font-mono font-bold text-indigo-500">{lr}</span>
          </div>
          <input 
            type="range" 
            min="0.01" 
            max="0.5" 
            step="0.01" 
            value={lr} 
            onChange={(e) => setLr(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      </div>
      <div ref={boardRef} className="w-full h-80 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl shadow-inner overflow-hidden transition-colors" />
    </div>
  );
}
