import { useEffect, useRef, useState, useCallback } from 'react';
import JXG from 'jsxgraph';
import { usePyodide } from '../hooks/usePyodide';
import { debounce } from '../utils/debounce';

export default function GradientDescentBoard() {
  const boardRef = useRef(null);
  const boardInstance = useRef(null);
  const startPointRef = useRef(null);
  const pathRef = useRef(null);
  const [lr, setLr] = useState(0.1);
  const { runPython, isLoading } = usePyodide();

  const runDescent = useCallback(async (x0, y0, currentLr) => {
    if (isLoading) return;

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
      const points = JSON.parse(result.replace(/'/g, '"'));
      
      if (pathRef.current) {
        boardInstance.current.removeObject(pathRef.current);
      }

      // Отрисовываем путь градиентного спуска
      pathRef.current = boardInstance.current.create('curve', [
        points.map(p => p[0]),
        points.map(p => p[1])
      ], { strokeColor: '#ef4444', strokeWidth: 3, strokeOpacity: 0.8 });

    } catch (err) {
      console.error("GD calculation error:", err);
    }
  }, [runPython, isLoading]);

  const debouncedRun = useCallback(debounce((x, y, l) => runDescent(x, y, l), 50), [runDescent]);

  useEffect(() => {
    if (!boardRef.current) return;

    const board = JXG.JSXGraph.initBoard(boardRef.current.id, {
      boundingbox: [-5, 5, 5, -5],
      axis: true,
      showCopyright: false,
      resize: { enabled: false }
    });
    boardInstance.current = board;

    // Контуры функции потерь (эллипсы для x^2 + 2y^2)
    for (let r = 1; r <= 5; r++) {
      board.create('ellipse', [[0, 0], [r, 0], [0, r/Math.sqrt(2)]], {
        strokeColor: '#cbd5e1',
        strokeWidth: 1,
        dash: 2,
        fixed: true,
        fillOpacity: 0
      });
    }

    // Начальная точка
    const p = board.create('point', [3, 4], {
      name: 'Start',
      color: '#6366f1',
      size: 5
    });
    startPointRef.current = p;

    p.on('drag', () => debouncedRun(p.X(), p.Y(), lr));

    runDescent(3, 4, lr);

    return () => JXG.JSXGraph.freeBoard(board);
  }, []);

  // При изменении LR пересчитываем
  useEffect(() => {
    if (startPointRef.current) {
      runDescent(startPointRef.current.X(), startPointRef.current.Y(), lr);
    }
  }, [lr]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div className="flex-1">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1">Градиентный спуск</h4>
          <p className="text-xs text-slate-500">Перетащите синюю точку или измените Learning Rate (шаг обучения).</p>
        </div>
        <div className="flex flex-col items-end gap-2 w-48">
          <div className="flex justify-between w-full">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Learning Rate</span>
            <span className="text-xs font-mono font-bold text-indigo-600">{lr}</span>
          </div>
          <input 
            type="range" 
            min="0.01" 
            max="0.5" 
            step="0.01" 
            value={lr} 
            onChange={(e) => setLr(parseFloat(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
        </div>
      </div>
      <div id="gd-board" ref={boardRef} className="w-full h-80 bg-white border border-slate-200 rounded-lg shadow-inner overflow-hidden" />
    </div>
  );
}
