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
      className="flex flex-col bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden h-full max-h-150"
    >
      <div className="bg-slate-900 p-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-lg">🤖</div>
        <div>
          <h4 className="text-sm font-bold text-white">AI-Тьютор</h4>
          <p className="text-[10px] text-slate-400">Всегда готов помочь</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.length === 0 && !isTyping && (
          <p className="text-center text-slate-400 text-sm py-10">
            Ошибок пока нет. Бот спит... 😴
          </p>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
              msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-100'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex gap-1">
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-100 bg-white">
        <button 
          onClick={askTutor}
          disabled={isTyping || !error}
          className="w-full py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          {messages.length > 0 ? "Спросить еще раз" : "Проанализировать ошибку"}
        </button>
      </div>
    </motion.div>
  );
}
