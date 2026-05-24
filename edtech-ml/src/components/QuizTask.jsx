import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProgress } from '../context/ProgressContext';
import { storage } from '../utils/storage';
import ChartBlock from './ChartBlock';

/**
 * QuizTask с поддержкой режима просмотра (Review Mode) для пройденных уроков.
 */
export default function QuizTask({ lessonId, stepIndex, quiz, onSuccess }) {
  const { addXP } = useProgress();
  
  // Поддержка как одного вопроса, так и массива вопросов
  const questions = Array.isArray(quiz.questions) ? quiz.questions : [quiz];
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const currentQuiz = questions[currentQIdx];

  const [selectedIds, setSelectedIds] = useState([]);
  const [status, setStatus] = useState(null); 
  const [errorMsg, setErrorMsg] = useState('');

  const isStepCompleted = storage.isStepCompleted(lessonId, stepIndex);
  
  // В режиме просмотра (если урок пройден) вопросы считаются "решенными" сразу
  const [isCurrentQuestionSolved, setIsCurrentQuestionSolved] = useState(isStepCompleted);

  // Блокируем выбор, если вопрос решен в текущей сессии ИЛИ урок уже был пройден ранее
  const isLocked = isCurrentQuestionSolved;

  const toggleOption = (id) => {
    if (isLocked) return;
    
    if (currentQuiz.multipleChoice) {
      setSelectedIds(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    } else {
      setSelectedIds([id]);
    }
    setStatus(null);
    setErrorMsg('');
  };

  const handleCheck = () => {
    if (selectedIds.length === 0) return;

    const isCorrect = 
      selectedIds.length === currentQuiz.correctAnswers.length &&
      selectedIds.every(id => currentQuiz.correctAnswers.includes(id));

    if (isCorrect) {
      setStatus('success');
      setIsCurrentQuestionSolved(true);
      
      if (currentQIdx === questions.length - 1) {
        if (!isStepCompleted) {
          addXP(5 * questions.length);
          storage.setStepCompleted(lessonId, stepIndex);
          if (onSuccess) onSuccess();
        }
      }
    } else {
      setStatus('error');
      setErrorMsg('Неверно. Попробуйте еще раз.');
    }
  };

  const handleNext = () => {
    const nextIdx = currentQIdx + 1;
    setCurrentQIdx(nextIdx);
    setSelectedIds([]);
    setStatus(null);
    setErrorMsg('');
    // Если урок пройден, следующий вопрос тоже будет в режиме просмотра
    setIsCurrentQuestionSolved(isStepCompleted);
  };

  return (
    <div className="space-y-6">
      {questions.length > 1 && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
            Вопрос {currentQIdx + 1} из {questions.length}
          </span>
          <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-indigo-500" 
              initial={{ width: 0 }}
              animate={{ width: `${((currentQIdx + 1) / questions.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {currentQuiz.chart && (
        <div className="mb-4 -mx-4 md:mx-0">
          <ChartBlock content={JSON.stringify(currentQuiz.chart)} hideTitle={true} />
        </div>
      )}

      <div className="text-base font-bold text-slate-900 leading-snug">
        {currentQuiz.question}
      </div>

      <div className="space-y-2">
        {currentQuiz.options.map((option) => {
          const isSelected = selectedIds.includes(option.id);
          const isCorrectAnswer = currentQuiz.correctAnswers.includes(option.id);
          
          let cardStyle = "border-slate-200 bg-white hover:border-slate-300";
          let indicatorStyle = "border-slate-200 text-transparent";

          // Если вопрос решен (или мы в режиме просмотра пройденного урока)
          if (isCurrentQuestionSolved) {
            if (isCorrectAnswer) {
              cardStyle = "border-emerald-500 bg-emerald-50/20";
              indicatorStyle = "border-emerald-500 text-emerald-600";
            } else if (isSelected) {
              cardStyle = "border-rose-400 bg-rose-50/20 opacity-80";
              indicatorStyle = "border-rose-400 text-rose-500";
            } else {
              cardStyle = "border-slate-100 bg-white opacity-40";
              indicatorStyle = "border-slate-100";
            }
          } else if (isSelected) {
            cardStyle = "border-indigo-500 bg-indigo-50/10 shadow-sm";
            indicatorStyle = "border-indigo-600 text-indigo-600";
          }

          return (
            <button
              key={option.id}
              onClick={() => toggleOption(option.id)}
              disabled={isLocked}
              className={`w-full flex items-center gap-4 p-4 border rounded-lg transition-all duration-150 text-left ${cardStyle}`}
            >
              <div className={`w-6 h-6 shrink-0 flex items-center justify-center border-[1px] bg-white transition-all ${
                currentQuiz.multipleChoice ? 'rounded-md' : 'rounded-full'
              } ${indicatorStyle}`}>
                {(isSelected || (isCurrentQuestionSolved && isCorrectAnswer)) && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    {currentQuiz.multipleChoice ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <div className="w-2.5 h-2.5 bg-current rounded-full" />
                    )}
                  </motion.div>
                )}
              </div>
              <span className="text-sm font-medium text-slate-700">{option.text}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 pt-2">
        {!isCurrentQuestionSolved ? (
          <button
            onClick={handleCheck}
            disabled={selectedIds.length === 0}
            className="px-8 py-2.5 bg-slate-900 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-black transition-all active:scale-95 disabled:opacity-30"
          >
            Проверить
          </button>
        ) : (
          currentQIdx < questions.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-8 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 shadow-md"
            >
              Следующий вопрос
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase text-emerald-600 tracking-tight flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                Задание выполнено
              </span>
              {isStepCompleted && (
                 <button 
                  onClick={() => { setCurrentQIdx(0); setIsCurrentQuestionSolved(true); setSelectedIds([]); }}
                  className="text-[9px] font-bold text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                 >
                   Повторить просмотр
                 </button>
              )}
            </div>
          )
        )}

        <AnimatePresence>
          {status === 'error' && (
            <motion.span initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="text-[10px] font-black uppercase text-rose-600">
              {errorMsg}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
