'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { apiRequest } from '@/lib/api';
import { Bot, Send, Sparkles, Loader2, User, CornerDownLeft } from 'lucide-react';

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  details?: any;
}

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: 'Hello! I am your SubFlow AI Finance Assistant. I query your live PostgreSQL ledger to provide precise financial intelligence, MRR trajectory insights, and debtor analyses. How can I help you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    'How much revenue did we collect this month?',
    'Which customers have the highest outstanding balances?',
    'Which subscriptions expire this month?',
    'Show overdue invoices above ₹5,000',
    'Why did our MRR decrease?',
  ];

  const handleSend = async (questionText?: string) => {
    const q = questionText || input;
    if (!q.trim() || loading) return;

    const newMessages: Message[] = [...messages, { sender: 'user', text: q }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await apiRequest('/api/ai-assistant/ask', {
        method: 'POST',
        body: JSON.stringify({ question: q }),
      });

      if (res.success && res.data) {
        setMessages([
          ...newMessages,
          {
            sender: 'assistant',
            text: res.data.answer,
            details: res.data.details,
          },
        ]);
      } else {
        setMessages([
          ...newMessages,
          {
            sender: 'assistant',
            text: 'I encountered an error querying the financial database.',
          },
        ]);
      }
    } catch (e: any) {
      setMessages([
        ...newMessages,
        {
          sender: 'assistant',
          text: `Service error: ${e.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-[#714B67] dark:bg-purple-950/60 dark:text-purple-300">
              Intelligence Feature 5
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#252525] dark:text-white font-heading mt-1">
            AI Finance Assistant
          </h2>
          <p className="text-xs text-[#737373] dark:text-[#A1A1AA] mt-0.5">
            Database-backed financial queries and revenue analytics with natural language synthesis.
          </p>
        </div>

        {/* Quick Prompts Bar */}
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="px-3 py-1.5 text-xs rounded-full bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] hover:border-[#714B67] hover:text-[#714B67] dark:hover:text-purple-300 shadow-sm transition-all text-[#252525] dark:text-white flex items-center gap-1.5"
            >
              <Sparkles size={12} className="text-[#714B67]" />
              <span>{prompt}</span>
            </button>
          ))}
        </div>

        {/* Chat Window */}
        <div className="odoo-card flex flex-col h-[520px]">
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'assistant' && (
                  <div className="h-8 w-8 rounded-full bg-[#714B67] flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Bot size={18} />
                  </div>
                )}
                <div
                  className={`max-w-xl rounded-lg p-3.5 text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-[#714B67] text-white'
                      : 'bg-[#F7F7F8] dark:bg-[#27272A] text-[#252525] dark:text-white border border-[#E5E7EB] dark:border-[#3F3F46]'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                </div>
                {m.sender === 'user' && (
                  <div className="h-8 w-8 rounded-full bg-[#252525] flex items-center justify-center text-white shrink-0">
                    <User size={16} />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8 rounded-full bg-[#714B67] flex items-center justify-center text-white shrink-0">
                  <Bot size={18} />
                </div>
                <div className="bg-[#F7F7F8] dark:bg-[#27272A] rounded-lg p-3.5 text-xs flex items-center gap-2 text-[#737373]">
                  <Loader2 size={14} className="animate-spin text-[#714B67]" />
                  <span>Querying PostgreSQL relational models...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="p-3 border-t border-[#E5E7EB] dark:border-[#27272A] bg-white dark:bg-[#18181B]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask about revenue, overdue balances, renewal risks, or MRR..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs bg-[#F7F7F8] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] rounded-md focus:outline-none focus:ring-1 focus:ring-[#714B67] dark:text-white"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-4 py-2 text-xs font-semibold rounded-md bg-[#714B67] hover:bg-[#55364E] text-white shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                <span>Send</span>
                <Send size={13} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
