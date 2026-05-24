import { useEffect, useRef, useCallback, useState } from 'react';
import JXG from 'jsxgraph';
import { usePyodide } from '../hooks/usePyodide';
import { debounce } from '../utils/debounce';
import { useTheme } from '../context/ThemeContext';

export default function SVMBoard() {
  const boardRef = useRef(null);
  const boardInstance = useRef(null);
  const pointsRef = useRef([]);
  const lineRef = useRef(null);
  const { runPython, isLoading } = usePyodide();
  const [loss, setLoss] = useState(null);
  const { theme } = useTheme();

  const isDark = theme === 'dark';

  const calculateSVM = useCallback(async () => {
    if (isLoading || !lineRef.current) return;

    // Собираем координаты и метки классов
    const data = pointsRef.current.map(p => ({
      x: p.X(),
      y: p.Y(),
      label: p.getAttribute('color') === '#ef4444' ? 0 : 1 
    }));

    const lineP1 = [lineRef.current.point1.X(), lineRef.current.point1.Y()];
    const lineP2 = [lineRef.current.point2.X(), lineRef.current.point2.Y()];

    const pythonCode = `
import numpy as np
points = ${JSON.stringify(data)}
p1 = np.array(${JSON.stringify(lineP1)})
p2 = np.array(${JSON.stringify(lineP2)})

A = p1[1] - p2[1]
B = p2[0] - p1[0]
C = p1[0]*p2[1] - p2[0]*p1[1]

total_loss = 0
for p in points:
    x, y, label = p['x'], p['y'], p['label']
    val = A*x + B*y + C
    target = -1 if label == 0 else 1
    total_loss += max(0, 1 - target * val / np.sqrt(A**2 + B**2))

round(total_loss / len(points), 4)
`;

    try {
      const { result } = await runPython(pythonCode);
      setLoss(result);
    } catch (err) {
      console.error("SVM calculation error:", err);
    }
  }, [runPython, isLoading]);

  const debouncedCalculate = useCallback(debounce(calculateSVM, 50), [calculateSVM]);

  useEffect(() => {
    if (!boardRef.current) return;

    if (boardInstance.current) {
      JXG.JSXGraph.freeBoard(boardInstance.current);
    }

    const board = JXG.JSXGraph.initBoard(boardRef.current.id, {
      boundingbox: [-5, 5, 5, -5],
      axis: true,
      showCopyright: false,
      resize: { enabled: false },
      defaultAxes: {
        x: { strokeColor: isDark ? '#475569' : '#cbd5e1', label: { color: isDark ? '#94a3b8' : '#64748b' } },
        y: { strokeColor: isDark ? '#475569' : '#cbd5e1', label: { color: isDark ? '#94a3b8' : '#64748b' } }
      }
    });
    boardInstance.current = board;

    const class1 = [[-2, 2], [-3, 1], [-1, 3], [-4, 2]];
    const class2 = [[2, -2], [3, -1], [1, -3], [4, -2]];

    const p1 = class1.map(c => board.create('point', c, { color: '#ef4444', name: '', size: 4, fixed: true }));
    const p2 = class2.map(c => board.create('point', c, { color: isDark ? '#818CF8' : '#6366f1', name: '', size: 4, fixed: true }));
    pointsRef.current = [...p1, ...p2];

    const lp1 = board.create('point', [-4, -1], { name: 'A', color: isDark ? '#F8FAFC' : '#0F172A', size: 3 });
    const lp2 = board.create('point', [4, 1], { name: 'B', color: isDark ? '#F8FAFC' : '#0F172A', size: 3 });
    lineRef.current = board.create('line', [lp1, lp2], { strokeColor: isDark ? '#F8FAFC' : '#0F172A', strokeWidth: 2 });

    lp1.on('drag', debouncedCalculate);
    lp2.on('drag', debouncedCalculate);

    calculateSVM();

    return () => JXG.JSXGraph.freeBoard(board);
  }, [theme]);

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-[var(--bg-subpanel)] p-5 rounded-xl border border-[var(--border-main)] transition-colors">
        <div>
           <h4 className="text-[11px] font-bold text-[var(--text-bright)] uppercase tracking-widest mb-1">Разделяющая гиперплоскость (SVM)</h4>
           <p className="text-[11px] text-[var(--text-muted)] font-medium leading-tight">Двигайте точки A и B для минимизации ошибки.</p>
        </div>
        <div className="text-right shrink-0">
           <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest block mb-1">Hinge Loss</span>
           <span className="text-xl font-mono font-bold text-indigo-500">{loss ?? '---'}</span>
        </div>
      </div>
      <div id="svm-board" ref={boardRef} className="w-full h-80 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl shadow-inner overflow-hidden transition-colors" />
    </div>
  );
}
