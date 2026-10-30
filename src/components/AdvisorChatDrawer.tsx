import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Sparkles, 
  Loader2, 
  Bot
} from 'lucide-react';
import { BankAccount, ChatMessage, MonthlyIncomeRecord, PartnerProfile, Transaction } from '../types';
import { calculateCoupleFinances } from '../utils/calculations';

interface AdvisorChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  accounts: BankAccount[];
  partners: PartnerProfile[];
  monthlyIncomes: MonthlyIncomeRecord[];
}

export const AdvisorChatDrawer: React.FC<AdvisorChatDrawerProps> = ({
  isOpen,
  onClose,
  transactions,
  accounts,
  partners,
  monthlyIncomes,
}) => {
  const p1 = partners.find(p => p.id === 'partner1') || partners[0];
  const p2 = partners.find(p => p.id === 'partner2') || partners[1];
  const summary = calculateCoupleFinances(transactions, accounts, partners, monthlyIncomes);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content: `Ahojte ${p1.name} a ${p2.name}! Som **DuoAdvisor**, váš finančný poradca pre spoločné aj súkromné financie v eurách (€).

Mám prehľad o vašich bankových účtoch, príjmoch a výdavkoch. Ako vám môžem pomôcť? Môžete sa ma opýtať na vyrovnanie výdavkov, pomer delenia rozpočtu alebo tipy, kde ušetriť.`,
      timestamp: 'Teraz',
      modelUsed: 'gemini-3.8-flash',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'gemini-3.8-flash' | 'gemini-4-argon' | 'gemini-3.1-flash-lite'>('gemini-3.8-flash');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const quickPrompts = [
    `Koľko má poslať každý z nás na spoločný účet?`,
    `Aký je náš pomer príjmov a podiel na nákladoch?`,
    `Koľko sme minuli na potraviny a bývanie zo spoločného?`,
    `Koľko zostáva každému na súkromné útraty?`,
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const financialContext = {
        partner1: `${p1.name} (Príjem: ${summary.currentMonthIncome.partner1} €)`,
        partner2: `${p2.name} (Príjem: ${summary.currentMonthIncome.partner2} €)`,
        incomeRatio: `${(summary.currentMonthIncome.partner1Ratio * 100).toFixed(1)}% / ${(summary.currentMonthIncome.partner2Ratio * 100).toFixed(1)}%`,
        totalExpense: `${summary.totalExpense} €`,
        commonExpense: `${summary.commonExpense} €`,
        partner1TransferToJoint: `${summary.contributions.partner1TransferToJoint} €`,
        partner2TransferToJoint: `${summary.contributions.partner2TransferToJoint} €`,
        partner1PrivateExpense: `${summary.partner1PrivateExpense} €`,
        partner2PrivateExpense: `${summary.partner2PrivateExpense} €`,
        jointAccountExpense: `${summary.jointAccountExpense} €`,
        savings: `${summary.netMonthlySavings} €`,
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({
            role: m.role,
            content: m.content,
          })),
          financialContext,
          modelPreference: selectedModel,
        }),
      });

      const res = await response.json();
      if (!response.ok || !res.success) {
        throw new Error(res.error || 'Chyba v AI odpovedi.');
      }

      setMessages(prev => [
        ...prev,
        {
          id: 'asst-' + Date.now(),
          role: 'assistant',
          content: res.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: res.modelUsed || selectedModel,
        },
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'assistant',
          content: `Aktuálny prehľad: Celkové spoločné výdavky sú ${summary.commonExpense.toFixed(2)} €. Na spoločný účet posiela ${p1.name}: ${summary.contributions.partner1TransferToJoint.toFixed(2)} € a ${p2.name}: ${summary.contributions.partner2TransferToJoint.toFixed(2)} € podľa podielu príjmov.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: 'offline-advisor',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-zinc-900 border-l border-zinc-800 shadow-2xl flex flex-col">
      {/* Top Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
              <span>DuoAdvisor AI</span>
            </h3>
            <p className="text-[11px] text-zinc-400">
              Finančný poradca pre {p1.name} & {p2.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as any)}
            className="bg-zinc-800 border border-zinc-700 text-[11px] text-zinc-200 rounded px-2 py-0.5 focus:outline-none"
          >
            <option value="gemini-3.8-flash">gemini-3.8-flash (Štandard)</option>
            <option value="gemini-4-argon">gemini-4-argon (Pokročilý)</option>
            <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Rýchly)</option>
          </select>

          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Message History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-zinc-100 text-zinc-950 font-medium rounded-br-sm'
                    : 'bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-bl-sm'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
              <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-zinc-500 font-mono">
                <span>{msg.timestamp}</span>
                {msg.modelUsed && <span>• {msg.modelUsed}</span>}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-zinc-400 p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl w-fit">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-300" />
            <span>DuoAdvisor analyzuje dáta...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-3 py-2 border-t border-zinc-800 bg-zinc-950/60 overflow-x-auto scrollbar-none flex gap-1.5">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-900">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Opýtajte sa na príspevky na spoločný účet..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 disabled:opacity-40 text-zinc-950 transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
