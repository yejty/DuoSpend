import React, { useState } from 'react';
import { Plus, X, Share2, Lock } from 'lucide-react';
import { BankAccount, Category, OwnerId, PartnerProfile, Transaction } from '../types';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: BankAccount[];
  partners: PartnerProfile[];
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
}

const SLOVAK_CATEGORIES: Category[] = [
  'Potraviny a domácnosť',
  'Bývanie a nájom',
  'Energie a účty',
  'Reštaurácie a kaviarne',
  'Doprava a pohonné hmoty',
  'Nákupy a osobná radosť',
  'Zdravie a šport',
  'Zdravie a lekáreň',
  'Zábava a predplatné',
  'Cestovanie a dovolenka',
  'Deti a domáci miláčikovia',
  'Príjem a mzda',
  'Iné',
];

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  accounts,
  partners,
  onAddTransaction,
}) => {
  const p1 = partners.find(p => p.id === 'partner1') || partners[0];
  const p2 = partners.find(p => p.id === 'partner2') || partners[1];

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<Category>('Potraviny a domácnosť');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [paidBy, setPaidBy] = useState<OwnerId>('partner1');
  const [isShared, setIsShared] = useState(true);
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent, addAnother = false) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!description.trim() || isNaN(numAmount) || numAmount <= 0) return;

    onAddTransaction({
      description: description.trim(),
      amount: numAmount,
      date,
      category,
      accountId: accountId || accounts[0]?.id || 'acc-1',
      paidByOwnerId: paidBy,
      isShared,
      type: txType,
      note: note.trim() || undefined,
    });

    if (addAnother) {
      setDescription('');
      setAmount('');
      setNote('');
    } else {
      setDescription('');
      setAmount('');
      setNote('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-zinc-100">
              Pridať transakciu
            </h3>
            <span className="text-xs text-zinc-500">• Mena EUR (€)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={(e) => handleSubmit(e, false)} className="p-4 space-y-3.5 text-xs">
          {/* Typ: Výdavok vs Príjem */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-950 rounded-lg border border-zinc-800 font-medium">
            <button
              type="button"
              onClick={() => setTxType('expense')}
              className={`py-1.5 rounded transition ${
                txType === 'expense'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Výdavok (−)
            </button>
            <button
              type="button"
              onClick={() => setTxType('income')}
              className={`py-1.5 rounded transition ${
                txType === 'income'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Príjem (+)
            </button>
          </div>

          {/* Suma a Dátum */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Suma (€)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-3 pr-8 py-2 text-sm text-zinc-100 font-mono font-semibold focus:outline-none focus:border-zinc-700"
                />
                <span className="absolute right-3 top-2 text-sm text-zinc-500 font-mono">€</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Dátum
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none"
              />
            </div>
          </div>

          {/* Popis */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Popis / Obchodník
            </label>
            <input
              type="text"
              placeholder="napr. Billa nákup, Kaviareň, Lekáreň"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none"
            />
          </div>

          {/* Kategória a Účet */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Kategória
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-100 focus:outline-none"
              >
                {SLOVAK_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Bankový účet
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-100 focus:outline-none"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.institution})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Kto platil a Zaradenie */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Kto platil?
              </label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value as OwnerId)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-100 focus:outline-none"
              >
                <option value="partner1">{p1.name} (Partner 1)</option>
                <option value="partner2">{p2.name} (Partner 2)</option>
                <option value="joint">Spoločný účet páru</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Zaradenie pre pár
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsShared(true)}
                  className={`py-1 px-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1 transition ${
                    isShared
                      ? 'bg-zinc-800 text-zinc-100 border-zinc-700'
                      : 'bg-zinc-950 text-zinc-500 border-zinc-800'
                  }`}
                >
                  <Share2 className="w-3 h-3" />
                  <span>Spoločné</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsShared(false)}
                  className={`py-1 px-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1 transition ${
                    !isShared
                      ? 'bg-zinc-800 text-zinc-100 border-zinc-700'
                      : 'bg-zinc-950 text-zinc-500 border-zinc-800'
                  }`}
                >
                  <Lock className="w-3 h-3" />
                  <span>Súkromné</span>
                </button>
              </div>
            </div>
          </div>

          {/* Poznámka */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Poznámka
            </label>
            <input
              type="text"
              placeholder="voliteľná poznámka"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none"
            />
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 transition"
            >
              Zrušiť
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition"
            >
              Uložiť a ďalšia
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition"
            >
              Uložiť
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
