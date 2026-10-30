import React, { useState } from 'react';
import { 
  Building2, 
  ArrowRight, 
  Check, 
  Share2, 
  Lock, 
  TrendingUp, 
  Plus, 
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { BankAccount, MonthlyIncomeRecord, PartnerProfile, Transaction } from '../types';
import { calculateCoupleFinances, formatCurrency } from '../utils/calculations';

interface OverviewTabProps {
  transactions: Transaction[];
  accounts: BankAccount[];
  partners: PartnerProfile[];
  monthlyIncomes: MonthlyIncomeRecord[];
  onOpenPdfModal: () => void;
  onOpenManualModal: () => void;
  onOpenIncomeModal: () => void;
  onSelectAccountTab: () => void;
  onSelectAnalyticsTab: () => void;
  onToggleShared: (txId: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  transactions,
  accounts,
  partners,
  monthlyIncomes,
  onOpenPdfModal,
  onOpenManualModal,
  onOpenIncomeModal,
  onSelectAccountTab,
  onSelectAnalyticsTab,
  onToggleShared,
}) => {
  const [transfersSentNotice, setTransfersSentNotice] = useState(false);

  const summary = calculateCoupleFinances(
    transactions,
    accounts,
    partners,
    monthlyIncomes
  );

  const p1 = partners.find(p => p.id === 'partner1') || partners[0];
  const p2 = partners.find(p => p.id === 'partner2') || partners[1];

  const sharedPercent = summary.totalExpense > 0 
    ? Math.round((summary.commonExpense / summary.totalExpense) * 100) 
    : 0;

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7);

  const topCategories = Object.entries(summary.categoryTotals)
    .filter(([_, data]) => data.total > 0)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* 1. Hlavná karta: Prevod na spoločný účet podľa podielu */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
              Pravidlo páru • Spoločný účet
            </div>
            <h2 className="text-lg font-semibold text-zinc-100 tracking-tight mt-0.5">
              Mesačný príspevok na spoločný účet podľa podielu
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Každý partner posiela svoj podiel zo mzdy na pokrytie spoločných výdavkov domácnosti
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenIncomeModal}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700/80 transition"
            >
              Upraviť príjem ({summary.currentMonthIncome.partner1Ratio * 100 > 0 ? `${(summary.currentMonthIncome.partner1Ratio * 100).toFixed(0)}% / ${(summary.currentMonthIncome.partner2Ratio * 100).toFixed(0)}%` : 'Pomer'})
            </button>
          </div>
        </div>

        {/* Kalkulácia dvoch partnerov */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-5">
          {/* Partner 1 (Alex) */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-200">
                {p1.name}
              </span>
              <span className="text-xs font-mono font-medium text-zinc-300">
                Podiel: {(summary.contributions.partner1Ratio * 100).toFixed(1)} %
              </span>
            </div>

            <div>
              <div className="text-[11px] text-zinc-500 uppercase tracking-wider font-mono">
                Požadovaný prevod na spoločný účet:
              </div>
              <div className="text-2xl font-bold font-mono text-zinc-100 mt-1">
                {formatCurrency(summary.contributions.partner1TransferToJoint)}
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-900 text-[11px] text-zinc-400 space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Podiel na spoločných ({formatCurrency(summary.commonExpense)}):</span>
                <span>{formatCurrency(summary.contributions.partner1FairShare)}</span>
              </div>
              {summary.contributions.partner1PaidOutOfPocket > 0 && (
                <div className="flex justify-between text-zinc-400">
                  <span>Zaplatené zo súkromného účtu:</span>
                  <span>− {formatCurrency(summary.contributions.partner1PaidOutOfPocket)}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-500">
                <span>Čistý mesačný príjem:</span>
                <span>{formatCurrency(summary.currentMonthIncome.partner1)}</span>
              </div>
            </div>
          </div>

          {/* Partner 2 (Sam) */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-200">
                {p2.name}
              </span>
              <span className="text-xs font-mono font-medium text-zinc-300">
                Podiel: {(summary.contributions.partner2Ratio * 100).toFixed(1)} %
              </span>
            </div>

            <div>
              <div className="text-[11px] text-zinc-500 uppercase tracking-wider font-mono">
                Požadovaný prevod na spoločný účet:
              </div>
              <div className="text-2xl font-bold font-mono text-zinc-100 mt-1">
                {formatCurrency(summary.contributions.partner2TransferToJoint)}
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-900 text-[11px] text-zinc-400 space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Podiel na spoločných ({formatCurrency(summary.commonExpense)}):</span>
                <span>{formatCurrency(summary.contributions.partner2FairShare)}</span>
              </div>
              {summary.contributions.partner2PaidOutOfPocket > 0 && (
                <div className="flex justify-between text-zinc-400">
                  <span>Zaplatené zo súkromného účtu:</span>
                  <span>− {formatCurrency(summary.contributions.partner2PaidOutOfPocket)}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-500">
                <span>Čistý mesačný príjem:</span>
                <span>{formatCurrency(summary.currentMonthIncome.partner2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Spodná lišta vyrovnania */}
        <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-zinc-400">
            Spoločné výdavky domácnosti: <strong className="text-zinc-100 font-mono">{formatCurrency(summary.commonExpense)}</strong>
            &nbsp;•&nbsp; Priamo zo spoločného účtu: <strong className="text-zinc-200 font-mono">{formatCurrency(summary.jointAccountExpense)}</strong>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setTransfersSentNotice(true);
                setTimeout(() => setTransfersSentNotice(false), 3000);
              }}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition"
            >
              Označiť prevody za poslané
            </button>
            {transfersSentNotice && (
              <span className="text-xs text-zinc-300 font-mono">
                ✓ Zaevidované
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Štyri minimalistické štatistické karty */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-400">Celkové výdavky páru</div>
          <div className="text-xl font-bold font-mono text-zinc-100 mt-1">
            {formatCurrency(summary.totalExpense)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 flex justify-between">
            <span>Spoločný príjem:</span>
            <span className="font-mono text-zinc-400">{formatCurrency(summary.currentMonthIncome.total)}</span>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-400">Spoločné (Domácnosť)</div>
          <div className="text-xl font-bold font-mono text-zinc-100 mt-1">
            {formatCurrency(summary.commonExpense)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 flex justify-between">
            <span>Podiel z celku:</span>
            <span className="font-mono text-zinc-400">{sharedPercent} %</span>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-400">{p1.name} (Súkromné)</div>
          <div className="text-xl font-bold font-mono text-zinc-100 mt-1">
            {formatCurrency(summary.partner1PrivateExpense)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Osobná radosť Alex
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-400">{p2.name} (Súkromné)</div>
          <div className="text-xl font-bold font-mono text-zinc-100 mt-1">
            {formatCurrency(summary.partner2PrivateExpense)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Osobná radosť Sam
          </div>
        </div>
      </div>

      {/* 3. Dva stĺpce: Kategórie a Posledné položky */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Kategórie */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Kľúčové výdavky podľa kategórií
            </h3>
            <button
              onClick={onSelectAnalyticsTab}
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              Všetky grafy
            </button>
          </div>

          <div className="mt-3.5 space-y-3">
            {topCategories.map(([categoryName, data]) => {
              const sharedShare = data.total > 0 ? Math.round((data.common / data.total) * 100) : 0;
              return (
                <div key={categoryName} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-medium">{categoryName}</span>
                    <span className="font-mono font-bold text-zinc-100">{formatCurrency(data.total)}</span>
                  </div>
                  <div className="w-full bg-zinc-950 rounded-full h-1 overflow-hidden flex">
                    <div
                      className="bg-zinc-300 h-1"
                      style={{ width: `${(data.common / (data.total || 1)) * 100}%` }}
                    />
                    <div
                      className="bg-zinc-600 h-1"
                      style={{ width: `${((data.partner1 + data.partner2) / (data.total || 1)) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                    <span>Spoločné: {formatCurrency(data.common)} ({sharedShare} %)</span>
                    <span>Súkromné: {formatCurrency(data.partner1 + data.partner2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Posledné položky */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Posledné položky
            </h3>
            <span className="text-[11px] text-zinc-500">Kliknite na odznak pre zmenu</span>
          </div>

          <div className="mt-1 divide-y divide-zinc-800/60">
            {recentTransactions.map((tx) => {
              const owner = tx.paidByOwnerId === 'partner1' ? p1 : tx.paidByOwnerId === 'partner2' ? p2 : null;

              return (
                <div key={tx.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={() => onToggleShared(tx.id)}
                      title="Kliknite pre prepnutie Spoločné / Súkromné"
                      className={`px-2 py-0.5 rounded text-[10px] font-medium border transition ${
                        tx.isShared
                          ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                          : 'bg-zinc-950 text-zinc-500 border-zinc-800'
                      }`}
                    >
                      {tx.isShared ? 'Spoločné' : 'Súkromné'}
                    </button>

                    <div className="min-w-0">
                      <div className="text-xs font-medium text-zinc-200 truncate">
                        {tx.description}
                      </div>
                      <div className="text-[10px] text-zinc-500 flex items-center gap-2 font-mono">
                        <span>{tx.date}</span>
                        <span>•</span>
                        <span>{tx.category}</span>
                        {owner && (
                          <span>• {owner.name}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className={`text-xs font-mono font-bold whitespace-nowrap ${
                    tx.type === 'income' ? 'text-zinc-100' : 'text-zinc-300'
                  }`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
