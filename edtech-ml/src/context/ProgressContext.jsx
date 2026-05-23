import { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../utils/storage';

const ProgressContext = createContext();

export const ProgressProvider = ({ children }) => {
  const [xp, setXp] = useState(() => {
    const savedXp = localStorage.getItem('user-xp');
    return savedXp ? parseInt(savedXp, 10) : 0;
  });

  const [unlockedTests, setUnlockedTests] = useState(() => {
    const savedUnlocked = localStorage.getItem('user-unlocked-tests');
    return savedUnlocked ? JSON.parse(savedUnlocked) : [];
  });

  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    localStorage.setItem('user-xp', xp);
  }, [xp]);

  useEffect(() => {
    localStorage.setItem('user-unlocked-tests', JSON.stringify(unlockedTests));
  }, [unlockedTests]);

  const addXP = (amount) => {
    setXp(prev => prev + amount);
    addToast(`Успех! +${amount} XP`, 'success');
  };

  const spendXP = (amount, testKey) => {
    if (xp >= amount) {
      setXp(prev => prev - amount);
      setUnlockedTests(prev => [...prev, testKey]);
      addToast(`Потрачено: -${amount} XP`, 'info');
      return true;
    } else {
      addToast("Недостаточно XP для разблокировки!", "error");
      return false;
    }
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
    <ProgressContext.Provider value={{ xp, addXP, spendXP, unlockedTests, toasts, removeToast }}>
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
