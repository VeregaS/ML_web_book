import { useEffect, useRef } from 'react';
import JXG from 'jsxgraph';

export default function GeometryBoard() {
  const boardRef = useRef(null);

  useEffect(() => {
    // Инициализация доски (с жестким запретом на ресайз)
    const board = JXG.JSXGraph.initBoard(boardRef.current.id, {
      boundingbox: [-1, 10, 6, -2],
      axis: true,
      showCopyright: false,
      resize: { enabled: false } 
    });

    // Истинные значения (x: 1, 2, 3, 4)
    const points = [
      board.create('point', [1, 3], { name: 'Y1', fixed: true, size: 4, color: '#2563eb' }),
      board.create('point', [2, -0.5], { name: 'Y2', fixed: true, size: 4, color: '#2563eb' }),
      board.create('point', [3, 2], { name: 'Y3', fixed: true, size: 4, color: '#2563eb' }),
      board.create('point', [4, 7], { name: 'Y4', fixed: true, size: 4, color: '#2563eb' })
    ];

    // Линия предсказания (задаем по крайним точкам x=1 и x=4)
    const pPred1 = board.create('point', [1, 0], { name: 'Предсказание (x=1)', color: '#dc2626', size: 4 });
    const pPred2 = board.create('point', [4, 5], { name: 'Предсказание (x=4)', color: '#dc2626', size: 4 });
    board.create('line', [pPred1, pPred2], { strokeColor: '#dc2626', dash: 2, strokeWidth: 2 });

    // Отрисовка отрезков ошибок
    points.forEach((p) => {
      board.create('segment', [
        p,
        board.create('point', [
          () => p.X(),
          () => {
            const slope = (pPred2.Y() - pPred1.Y()) / (pPred2.X() - pPred1.X());
            const intercept = pPred1.Y() - slope * pPred1.X();
            return slope * p.X() + intercept;
          }
        ], { visible: false })
      ], { strokeColor: '#94a3b8', dash: 1, strokeWidth: 1 });
    });

    // --- МОСТ ДЛЯ PYTHON ---
    // Экспортируем функцию в глобальную область видимости
    window.updateLine = (y_start, y_end) => {
      // Анимированное перемещение точек (длительность 1000 мс)
      pPred1.moveTo([1, y_start], 1000);
      pPred2.moveTo([4, y_end], 1000);
    };

    return () => {
      if (board) {
        JXG.JSXGraph.freeBoard(board);
        delete window.updateLine; // Очистка при размонтировании
      }
    };
  }, []);

  // Архитектурное правило: жесткие height и max-height
  return (
    <div 
      id="jxgbox" 
      ref={boardRef} 
      className="w-full bg-white border border-slate-300 rounded-lg shadow-sm"
      style={{ height: '400px', maxHeight: '400px' }} 
    />
  );
}