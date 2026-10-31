'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ControlPanel } from '@/components/ui/ControlPanel';
import { apiRequest } from '@/lib/api';
import { Bot, Send, Sparkles, Loader2, User, CornerDownLeft, Database } from 'lucide-react';

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
        {/* Odoo Control Panel */}
        <ControlPanel
          title="AI Financial Analyst"
          subtitle="Ask questions in natural language; SubFlow queries live PostgreSQL ledger transactions to provide accurate financial answers."
          badge="DATABASE-BACKED"
        />

        {/* Quick Prompts Bar */}
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-[#714B67] hover:text-[#714B67] dark:hover:text-purple-300 shadow-sm transition-all text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles size={13} className="text-[#714B67]" />
              <span>{prompt}</span>
            </button>
          ))}
        </div>

        {/* Chat Window */}
        <div className="odoo-card flex flex-col h-[540px] overflow-hidden">
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'assistant' && (
                  <div className="h-8 w-8 rounded-xl bg-[#714B67] flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Bot size={17} />
                  </div>
                )}
                <div
                  className={`max-w-xl rounded-xl p-4 text-xs sm:text-sm leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-[#714B67] text-white shadow-sm'
                      : 'bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-700/80'
                  }`}
                >
                  <p className="whitespace-pre-line font-normal">{m.text}</p>
                </div>
                {m.sender === 'user' && (
                  <div className="h-8 w-8 rounded-xl bg-zinc-800 dark:bg-zinc-700 flex items-center justify-center text-white shrink-0 shadow-sm">
                    <User size={16} />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8 rounded-xl bg-[#714B67] flex items-center justify-center text-white shrink-0 shadow-sm">
                  <Bot size={17} />
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800/80 rounded-xl p-3.5 text-xs flex items-center gap-2.5 text-zinc-500 border border-zinc-200/80 dark:border-zinc-700/80">
                  <Loader2 size={15} className="animate-spin text-[#714B67]" />
                  <span>Synthesizing PostgreSQL ledger query results...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="p-3.5 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask about revenue trends, overdue balances, renewal pipeline, or churn analysis..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-[#F9FAFB] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#714B67] text-zinc-900 dark:text-zinc-100 shadow-inner"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="btn-odoo-primary px-4 py-2.5 text-xs sm:text-sm font-bold disabled:opacity-50"
              >
                <span>Ask</span>
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
