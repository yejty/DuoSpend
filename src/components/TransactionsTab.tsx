import React, { useState } from 'react';
import { 
  Search, 
  Share2, 
  Lock, 
  Plus, 
  Download, 
  Trash2, 
  ReceiptText
} from 'lucide-react';
import { BankAccount, Category, OwnerId, PartnerProfile, Transaction } from '../types';
import { formatCurrency } from '../utils/calculations';
import { getCategoryColor, getOwnerConfig } from '../utils/themeColors';

interface TransactionsTabProps {
  transactions: Transaction[];
  accounts: BankAccount[];
  partners: PartnerProfile[];
  onToggleShared: (txId: string) => void;
  onDeleteTransaction: (txId: string) => void;
  onOpenManualModal: () => void;
}

const ALL_CATEGORIES: Category[] = [
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

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions,
  accounts,
  partners,
  onToggleShared,
  onDeleteTransaction,
  onOpenManualModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedOwner, setSelectedOwner] = useState<string>('all');
  const [sharedFilter, setSharedFilter] = useState<'all' | 'shared' | 'private'>('all');

  const p1 = partners.find(p => p.id === 'partner1') || partners[0];
  const p2 = partners.find(p => p.id === 'partner2') || partners[1];

  const filteredTransactions = transactions.filter((tx) => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchDesc = tx.description.toLowerCase().includes(q);
      const matchNote = tx.note?.toLowerCase().includes(q);
      const matchCat = tx.category.toLowerCase().includes(q);
      if (!matchDesc && !matchNote && !matchCat) return false;
    }
    if (selectedCategory !== 'all' && tx.category !== selectedCategory) return false;
    if (selectedAccount !== 'all' && tx.accountId !== selectedAccount) return false;
    if (selectedOwner !== 'all' && tx.paidByOwnerId !== selectedOwner) return false;
    if (sharedFilter === 'shared' && !tx.isShared) return false;
    if (sharedFilter === 'private' && tx.isShared) return false;

    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleExportCsv = () => {
    const headers = ['Dátum', 'Popis', 'Suma (€)', 'Typ', 'Kategória', 'Zaradenie', 'Uhradil', 'Účet', 'Poznámka'];
    const rows = filteredTransactions.map(tx => {
      const acc = accounts.find(a => a.id === tx.accountId);
      const ownerName = tx.paidByOwnerId === 'partner1' ? p1.name : tx.paidByOwnerId === 'partner2' ? p2.name : 'Spoločný';
      return [
        tx.date,
        `"${tx.description.replace(/"/g, '""')}"`,
        tx.amount.toFixed(2),
        tx.type === 'income' ? 'Príjem' : 'Výdavok',
        tx.category,
        tx.isShared ? 'Spoločný' : 'Súkromný',
        ownerName,
        `"${acc?.name || 'Banka'}"`,
        `"${tx.note || ''}"`,
      ].join(';');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DuoSpend_Transakcie_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
              <ReceiptText className="w-4 h-4 text-zinc-400" />
              <span>Evidencia transakcií páru</span>
              <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono text-[10px]">
                {filteredTransactions.length} tx
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Zobrazených {filteredTransactions.length} z {transactions.length} položiek v mene EUR
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onOpenManualModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Pridať položku</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 pt-2 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Hľadať obchodníka, položku..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-2.5 py-1.5 text-zinc-200 placeholder-zinc-600 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={sharedFilter}
              onChange={(e) => setSharedFilter(e.target.value as any)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none"
            >
              <option value="all">Všetky výdavky</option>
              <option value="shared">Iba spoločné výdavky</option>
              <option value="private">Iba súkromné výdavky</option>
            </select>
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none"
            >
              <option value="all">Všetky kategórie</option>
              {ALL_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none"
            >
              <option value="all">Všetky účty</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedOwner}
              onChange={(e) => setSelectedOwner(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none"
            >
              <option value="all">Všetci platitelia</option>
              <option value="partner1">{p1.name}</option>
              <option value="partner2">{p2.name}</option>
              <option value="joint">Spoločný účet</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/70 text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Dátum</th>
                <th className="py-2.5 px-3">Popis / Obchodník</th>
                <th className="py-2.5 px-3">Zaradenie</th>
                <th className="py-2.5 px-3">Kategória</th>
                <th className="py-2.5 px-3">Účet a platiteľ</th>
                <th className="py-2.5 px-3 text-right">Suma v €</th>
                <th className="py-2.5 px-2 text-center">Akcia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-xs text-zinc-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500">
                    Nenašli sa žiadne transakcie.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const account = accounts.find(a => a.id === tx.accountId);
                  const isP1 = tx.paidByOwnerId === 'partner1';
                  const isP2 = tx.paidByOwnerId === 'partner2';
                  const ownerObj = isP1 ? p1 : isP2 ? p2 : null;
                  const ownerConf = getOwnerConfig(tx.paidByOwnerId);
                  const catColor = getCategoryColor(tx.category);

                  return (
                    <tr key={tx.id} className="hover:bg-zinc-800/30 transition">
                      <td className="py-2.5 px-3 whitespace-nowrap text-zinc-400 font-mono text-[11px]">
                        {tx.date}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-zinc-100">{tx.description}</span>
                          {tx.paymentMethod === 'cash' && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-neutral-800 text-neutral-400 font-mono">
                              Hotovosť
                            </span>
                          )}
                          {tx.warranty?.isWarranty && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
                              Záruka {tx.warranty.warrantyMonths}m
                            </span>
                          )}
                        </div>
                        {tx.note && (
                          <div className="text-[11px] text-zinc-500 italic mt-0.5">{tx.note}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <button
                          onClick={() => onToggleShared(tx.id)}
                          title="Kliknutím prepnete Spoločné / Súkromné"
                          className={`px-2 py-0.5 rounded text-[10px] font-medium border transition ${
                            tx.isShared
                              ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                              : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                          }`}
                        >
                          {tx.isShared ? <Share2 className="w-2.5 h-2.5 text-sky-400 inline mr-1" /> : <Lock className="w-2.5 h-2.5 text-zinc-400 inline mr-1" />}
                          <span>{tx.isShared ? 'Spoločné' : 'Súkromné'}</span>
                        </button>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="flex items-center gap-1.5 text-zinc-200">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: catColor }}
                          />
                          <span>{tx.category}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="text-zinc-200">{account?.name || 'Účet'}</div>
                        <div className="mt-0.5">
                          <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] border font-mono ${ownerConf.bgClass}`}>
                            {ownerObj ? ownerObj.name : 'Spoločný účet'}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap font-mono font-bold">
                        <span className={tx.type === 'income' ? 'text-emerald-400' : 'text-zinc-100'}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="p-1 text-zinc-600 hover:text-rose-400 transition"
                          title="Zmazať"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
