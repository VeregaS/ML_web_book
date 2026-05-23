import { useEffect, useRef, useCallback, useState } from 'react';
import JXG from 'jsxgraph';
import { usePyodide } from '../hooks/usePyodide';
import { debounce } from '../utils/debounce';

export default function SVMBoard() {
  const boardRef = useRef(null);
  const pointsRef = useRef([]);
  const lineRef = useRef(null);
  const { runPython, isLoading } = usePyodide();
  const [loss, setLoss] = useState(null);

  const calculateSVM = useCallback(async () => {
    if (isLoading) return;

    // Собираем координаты и метки классов
    const data = pointsRef.current.map(p => ({
      x: p.X(),
      y: p.Y(),
      label: p.getAttribute('color') === '#ef4444' ? 0 : 1 // Красные vs Синие
    }));

    // Позиция разделяющей линии (задается пользователем через 2 невидимые точки)
    const lineP1 = [lineRef.current.point1.X(), lineRef.current.point1.Y()];
    const lineP2 = [lineRef.current.point2.X(), lineRef.current.point2.Y()];

    const pythonCode = `
import numpy as np
import json

points = ${JSON.stringify(data)}
p1 = np.array(${JSON.stringify(lineP1)})
p2 = np.array(${JSON.stringify(lineP2)})

# Уравнение прямой по двум точкам: (y - y1)(x2 - x1) - (x - x1)(y2 - y1) = 0
# Ax + By + C = 0
A = p1[1] - p2[1]
B = p2[0] - p1[0]
C = p1[0]*p2[1] - p2[0]*p1[1]

# Считаем Hinge Loss
total_loss = 0
for p in points:
    x, y, label = p['x'], p['y'], p['label']
    # Значение функции f(x,y)
    val = A*x + B*y + C
    target = -1 if label == 0 else 1
    # Hinge loss: max(0, 1 - y * f(x))
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

    const board = JXG.JSXGraph.initBoard(boardRef.current.id, {
      boundingbox: [-5, 5, 5, -5],
      axis: true,
      showCopyright: false,
      resize: { enabled: false }
    });

    // Создаем точки двух классов
    const class1 = [[-2, 2], [-3, 1], [-1, 3], [-4, 2]];
    const class2 = [[2, -2], [3, -1], [1, -3], [4, -2]];

    const p1 = class1.map(c => board.create('point', c, { color: '#ef4444', name: '', size: 4, fixed: true }));
    const p2 = class2.map(c => board.create('point', c, { color: '#6366f1', name: '', size: 4, fixed: true }));
    pointsRef.current = [...p1, ...p2];

    // Интерактивная разделяющая линия
    const lp1 = board.create('point', [-4, -1], { name: 'Line A', color: '#334155', size: 3 });
    const lp2 = board.create('point', [4, 1], { name: 'Line B', color: '#334155', size: 3 });
    lineRef.current = board.create('line', [lp1, lp2], { strokeColor: '#334155', strokeWidth: 2 });

    lp1.on('drag', debouncedCalculate);
    lp2.on('drag', debouncedCalculate);

    calculateSVM();

    return () => JXG.JSXGraph.freeBoard(board);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <div>
           <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1">Разделяющая гиперплоскость (SVM)</h4>
           <p className="text-xs text-slate-500">Двигайте точки Line A и Line B, чтобы минимизировать ошибку разделения классов.</p>
        </div>
        <div className="text-right">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Текущий Hinge Loss</span>
           <span className="text-xl font-mono font-bold text-indigo-600">{loss ?? '---'}</span>
        </div>
      </div>
      <div id="svm-board" ref={boardRef} className="w-full h-80 bg-white border border-slate-200 rounded-lg shadow-inner overflow-hidden" />
    </div>
  );
}
