import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  ShieldAlert, 
  Sparkles, 
  Copy, 
  Check, 
  Trash2, 
  Minimize2 
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  isSafe?: boolean;
  engine?: string;
  timestamp: string;
}

interface AIChatModalProps {
  currentAccount?: string;
}

export const AIChatModal: React.FC<AIChatModalProps> = ({ currentAccount }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `### 🛡️ FORENSIC AI COPILOT READY\n\nI am your **Local Investigative Intelligence Assistant** equipped with an **Anti-Injection Security Guardrail**.\n\n**Capabilities:**\n- 📊 **Summarize Money Trail**: Graph hops, siphoned funds, and victim origin.\n- 🏛️ **Draft BNSS Statutory Notices**: Instant Section 106 & 107 freeze requisitions for Axis, SBI, HDFC.\n- 🔍 **Mule Risk Profiling**: Identify high-velocity smurfing accounts and recoverable liens.\n\n*All queries are verified against local graph data.*`,
      isSafe: true,
      engine: 'forensic-guardrail-engine',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          selected_account: currentAccount || null
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'No response generated.',
        isSafe: data.is_safe !== false,
        engine: data.engine || 'local-ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ Error contacting AI service: ${err.message}. Please ensure the backend is running.`,
        isSafe: false,
        engine: 'error',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: 'Session reset. Guardrail initialized. How can I assist with your cybercrime investigation?',
        isSafe: true,
        engine: 'forensic-guardrail-engine',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const quickPrompts = [
    { label: '📊 Summarize Trail', query: 'Summarize the multi-hop money trail for this case' },
    { label: '🏛️ Draft Section 106 Notice', query: 'Draft a Section 106 and 107 BNSS freeze notice for Axis Bank' },
    { label: '🔒 Check Recoverable Funds', query: 'Which accounts are holding recoverable funds right now?' },
    { label: '🚨 Inspect Mule Networks', query: 'Identify top money mule collector accounts in Stage 1 and Stage 2' }
  ];

  return (
    <>
      {/* 1. Floating Action Trigger Button (Bottom Right) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          title="Open AI Forensic Copilot (Local Ollama & Guardrail)"
          style={{
            position: 'fixed',
            bottom: '22px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 18px',
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            border: '2px solid #3B82F6',
            borderRadius: '9999px',
            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.35), 0 2px 8px rgba(0, 0, 0, 0.2)',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            backdropFilter: 'blur(10px)',
            transform: 'scale(1)'
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Sparkles size={18} color="#60A5FA" />
            <span style={{
              position: 'absolute',
              top: '-2px',
              right: '-3px',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              boxShadow: '0 0 6px #10B981'
            }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.84rem', letterSpacing: '0.02em' }}>
            Forensic AI
          </span>
          <span style={{
            fontSize: '0.68rem',
            fontWeight: 600,
            padding: '2px 7px',
            backgroundColor: 'rgba(59, 130, 246, 0.25)',
            color: '#93C5FD',
            borderRadius: '6px',
            border: '1px solid rgba(147, 197, 253, 0.3)'
          }}>
            Ollama
          </span>
        </button>
      )}

      {/* 2. Pop-up AI Chat Window (Bottom Right) */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '22px',
          right: '24px',
          width: '430px',
          maxWidth: 'calc(100vw - 40px)',
          height: '610px',
          maxHeight: 'calc(100vh - 44px)',
          zIndex: 10000,
          backgroundColor: '#0F172A',
          borderRadius: '16px',
          border: '2px solid #334155',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px',
            backgroundColor: '#1E293B',
            borderBottom: '1.5px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4)'
              }}>
                <Bot size={18} color="#FFFFFF" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#F8FAFC', fontWeight: 700, fontSize: '0.88rem' }}>
                    Forensic AI Copilot
                  </span>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#34D399',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}>
                    🛡️ Guarded
                  </span>
                </div>
                <div style={{ color: '#94A3B8', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Local Engine · Anti-Injection Active</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={handleClearHistory}
                title="Clear conversation"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px'
                }}
              >
                <Trash2 size={15} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Minimize window"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px'
                }}
              >
                <Minimize2 size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close chat"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px'
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Quick Action Chips */}
          <div style={{
            display: 'flex',
            gap: '6px',
            padding: '10px 14px',
            backgroundColor: '#111827',
            borderBottom: '1px solid #1E293B',
            overflowX: 'auto',
            whiteSpace: 'nowrap'
          }}>
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p.query)}
                disabled={isLoading}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  borderRadius: '9999px',
                  backgroundColor: '#1E293B',
                  color: '#94A3B8',
                  border: '1px solid #334155',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  flexShrink: 0
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#38BDF8';
                  e.currentTarget.style.borderColor = '#38BDF8';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = '#94A3B8';
                  e.currentTarget.style.borderColor = '#334155';
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Message List */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            backgroundColor: '#0F172A'
          }}>
            {messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '100%'
                }}
              >
                {/* Bubble Container */}
                <div style={{
                  position: 'relative',
                  maxWidth: '92%',
                  padding: '11px 14px',
                  borderRadius: msg.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  backgroundColor: msg.sender === 'user' 
                    ? '#2563EB' 
                    : msg.isSafe === false 
                      ? '#450A0A' 
                      : '#1E293B',
                  border: msg.sender === 'user'
                    ? '1px solid #3B82F6'
                    : msg.isSafe === false
                      ? '1px solid #DC2626'
                      : '1px solid #334155',
                  color: '#F8FAFC',
                  fontSize: '0.8rem',
                  lineHeight: 1.5,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                }}>
                  {/* Rejection / Injection warning badge */}
                  {msg.isSafe === false && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#F87171',
                      fontWeight: 700,
                      marginBottom: '6px',
                      fontSize: '0.72rem'
                    }}>
                      <ShieldAlert size={14} color="#EF4444" />
                      <span>Security Guardrail Intercepted</span>
                    </div>
                  )}

                  {/* Message Content formatted */}
                  <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit' }}>
                    {msg.text.split('\n').map((line, lIdx) => {
                      if (line.startsWith('### ')) {
                        return <h4 key={lIdx} style={{ margin: '4px 0 6px 0', color: '#60A5FA', fontSize: '0.86rem' }}>{line.replace('### ', '')}</h4>;
                      }
                      if (line.startsWith('#### ')) {
                        return <h5 key={lIdx} style={{ margin: '4px 0 4px 0', color: '#93C5FD', fontSize: '0.8rem' }}>{line.replace('#### ', '')}</h5>;
                      }
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return <div key={lIdx} style={{ fontWeight: 700, margin: '4px 0', color: '#F1F5F9' }}>{line.replaceAll('**', '')}</div>;
                      }
                      return <div key={lIdx}>{line}</div>;
                    })}
                  </div>

                  {/* Copy Button for Assistant message */}
                  {msg.sender === 'assistant' && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '8px',
                      paddingTop: '6px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      fontSize: '0.67rem',
                      color: '#64748B'
                    }}>
                      <span>{msg.engine}</span>
                      <button
                        onClick={() => handleCopyText(msg.id, msg.text)}
                        title="Copy to clipboard"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: copiedId === msg.id ? '#34D399' : '#94A3B8',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '2px 4px'
                        }}
                      >
                        {copiedId === msg.id ? <Check size={11} /> : <Copy size={11} />}
                        <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <span style={{ fontSize: '0.62rem', color: '#64748B', marginTop: '3px', padding: '0 4px' }}>
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {/* Typing / Loading indicator */}
            {isLoading && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                backgroundColor: '#1E293B',
                borderRadius: '10px',
                width: 'fit-content',
                border: '1px solid #334155'
              }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#38BDF8', animation: 'pulse 1s infinite' }} />
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#38BDF8', animation: 'pulse 1s infinite 0.2s' }} />
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#38BDF8', animation: 'pulse 1s infinite 0.4s' }} />
                </div>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Analyzing forensic graph & law...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box Footer */}
          <div style={{
            padding: '12px 14px',
            backgroundColor: '#1E293B',
            borderTop: '1.5px solid #334155'
          }}>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage();
              }}
              style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
            >
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask trail questions, draft notices, inspect mules..."
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#0F172A',
                  color: '#F8FAFC',
                  border: '1px solid #334155',
                  fontSize: '0.8rem',
                  outline: 'none'
                }}
                onFocus={e => (e.target.style.borderColor = '#3B82F6')}
                onBlur={e => (e.target.style.borderColor = '#334155')}
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                title="Send query"
                style={{
                  padding: '9px 14px',
                  backgroundColor: inputMessage.trim() ? '#2563EB' : '#334155',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: inputMessage.trim() ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <Send size={15} />
              </button>
            </form>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '8px',
              fontSize: '0.65rem',
              color: '#64748B'
            }}>
              <span>🛡️ Guardrail checks prompt safety</span>
              <span>Ollama: 127.0.0.1:11434</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
