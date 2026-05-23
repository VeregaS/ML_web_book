import { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../utils/storage';

const ProgressContext = createContext();

export const ProgressProvider = ({ children }) => {
  const [xp, setXp] = useState(() => {
    const savedXp = localStorage.getItem('user-xp');
    return savedXp ? parseInt(savedXp, 10) : 0;
  });

  const [streak, setStreak] = useState(() => {
    const savedStreak = localStorage.getItem('user-streak');
    return savedStreak ? parseInt(savedStreak, 10) : 1;
  });

  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    localStorage.setItem('user-xp', xp);
  }, [xp]);

  useEffect(() => {
    localStorage.setItem('user-streak', streak);
  }, [streak]);

  const addXP = (amount) => {
    setXp(prev => prev + amount);
    addToast(`Успех! +${amount} XP`, 'success');
  };

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Автоматическое удаление через 3 секунды
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ProgressContext.Provider value={{ xp, streak, addXP, toasts, removeToast }}>
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};
