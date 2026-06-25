import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, X, Brain, Loader2 } from 'lucide-react';
import { api } from '../../lib/api.js';

export default function IAChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '¡Hola! Soy el asistente inteligente de SIBIA. ¿En qué te puedo ayudar hoy? Si estás en la ficha de un estudiante, tendré acceso a sus datos académicos y emocionales.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const location = useLocation();
  // Intentar extraer el ID del alumno si estamos en AlumnoDetail.jsx (/alumnos/:id)
  const match = location.pathname.match(/\/alumnos\/([a-f0-9-]+)/i);
  const alumnoId = match ? match[1] : null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await api.post('/ia/chat', {
        pregunta: userMessage,
        alumnoId
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.respuesta }]);
    } catch (error) {
      console.error('Error en IAChat:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Ocurrió un inconveniente al conectar con el asistente. Recuerda iniciar el servidor backend.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen ? (
        <div className="w-85 sm:w-96 h-[480px] bg-surface border border-border rounded-2xl shadow-xl flex flex-col overflow-hidden transition-all duration-200">
          {/* Cabecera */}
          <div className="bg-primary-dark text-surface p-4 flex items-center justify-between border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
                <Brain size={18} className="text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm leading-tight text-white">Asistente SIBIA</h3>
                <span className="text-[10px] text-primary-light font-medium uppercase tracking-wider">
                  {alumnoId ? 'Modo Contextual: Alumno Activo' : 'Consulta General'}
                </span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Área de Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-bg">
            {messages.map((m, idx) => (
              <div 
                key={idx} 
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-primary-dark text-white rounded-tr-none' 
                      : 'bg-surface text-text-primary border border-border rounded-tl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-surface border border-border rounded-2xl rounded-tl-none p-3 flex items-center gap-2 shadow-sm">
                  <Loader2 size={16} className="animate-spin text-primary-dark" />
                  <span className="text-xs text-text-secondary font-medium">Analizando datos del sistema...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Formulario */}
          <form onSubmit={handleSend} className="p-3 border-t border-border bg-surface flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu consulta aquí..."
              className="flex-1 bg-bg border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-dark text-text-primary"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl bg-primary-dark text-white flex items-center justify-center hover:bg-primary-dark/95 disabled:bg-primary-light disabled:text-text-muted transition-all cursor-pointer border border-primary/20"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-primary-dark text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer border border-white/10 group"
        >
          <Brain size={24} className="group-hover:scale-110 transition-transform text-white" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
        </button>
      )}
    </div>
  );
}
