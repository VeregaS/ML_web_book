import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AITutorAgent({ code, error, isActive }) {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Триггер при появлении ошибки
  useEffect(() => {
    if (isActive && error && messages.length === 0) {
      askTutor();
    }
  }, [isActive, error]);

  const askTutor = async () => {
    if (!error) return;
    
    setIsTyping(true);
    const userPrompt = `Мой код:\n${code}\n\nОшибка:\n${error}\n\nПомоги мне понять, что не так, но не давай готовый код.`;

    try {
      // Используем Google Gemini API (бесплатный уровень)
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key не найден");

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Ты — AI-Тьютор по машинному обучению. Твоя задача: помогать студенту исправить ошибки в Python коде. 
              ПРАВИЛА: 
              1. Никогда не пиши полный исправленный код. 
              2. Анализируй Traceback и объясняй причину ошибки простыми словами. 
              3. Задавай наводящие вопросы. 
              4. Отвечай только на русском языке.
              
              ${userPrompt}`
            }]
          }]
        })
      });

      const data = await response.json();
      const botText = data.candidates[0].content.parts[0].text;
      
      setMessages(prev => [...prev, { role: 'assistant', text: botText }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Извини, я приболел (проблема с API). Попробуй проверить код еще раз сам!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isActive) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col bg-[var(--bg-app)] rounded-3xl border border-[var(--border-main)] shadow-xl overflow-hidden h-full max-h-150 transition-colors duration-300"
    >
      <div className="bg-[var(--bg-subpanel)] p-4 flex items-center gap-3 border-b border-[var(--border-main)] transition-colors duration-300">
        <div className="w-8 h-8 bg-[var(--accent-primary)] rounded-full flex items-center justify-center text-lg shadow-sm">🤖</div>
        <div>
          <h4 className="text-sm font-bold text-[var(--text-bright)]">AI-Тьютор</h4>
          <p className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider">Всегда готов помочь</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--bg-app)] custom-scrollbar transition-colors duration-300">
        {messages.length === 0 && !isTyping && (
          <p className="text-center text-[var(--text-muted)] text-sm py-10">
            Ошибок пока нет. Бот спит... 😴
          </p>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-sm transition-all duration-300 ${
              msg.role === 'user' ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-main)]'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-[var(--bg-card)] p-3 rounded-2xl border border-[var(--border-main)] shadow-sm flex gap-1.5 transition-colors duration-300">
              <span className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[var(--border-main)] bg-[var(--bg-card)] transition-colors duration-300">
        <button 
          onClick={askTutor}
          disabled={isTyping || !error}
          className="w-full py-3 bg-[var(--accent-primary)] text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:opacity-90 disabled:opacity-30 transition-all active:scale-[0.98] shadow-md"
        >
          {messages.length > 0 ? "Спросить еще раз" : "Проанализировать ошибку"}
        </button>
      </div>
    </motion.div>
  );
}
