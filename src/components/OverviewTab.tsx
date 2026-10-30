import React from 'react';
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
  onOpenIncomeModal,
}) => {
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

  return (
    <div className="space-y-6">
      {/* 1. Prevod na spoločný účet podľa podielu */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
            Prevod na spoločný účet
          </h2>

          <button
            onClick={onOpenIncomeModal}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700/80 transition"
          >
            Upraviť príjem ({summary.currentMonthIncome.partner1Ratio * 100 > 0 ? `${(summary.currentMonthIncome.partner1Ratio * 100).toFixed(0)}% / ${(summary.currentMonthIncome.partner2Ratio * 100).toFixed(0)}%` : 'Pomer'})
          </button>
        </div>

        {/* Karty partnerov bez zbytočných popisov */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          {/* Daniel */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-violet-500/30 space-y-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-500" />
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-400 ring-4 ring-violet-500/20" />
                <span className="text-sm font-semibold text-violet-300">
                  {p1.name}
                </span>
              </div>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-violet-500/15 text-violet-300 border border-violet-500/30">
                {(summary.contributions.partner1Ratio * 100).toFixed(1)} %
              </span>
            </div>

            <div>
              <div className="text-3xl font-bold font-mono text-violet-100">
                {formatCurrency(summary.contributions.partner1TransferToJoint)}
              </div>
              {summary.contributions.partner1PaidOutOfPocket > 0 && (
                <div className="text-xs text-violet-400/80 font-mono mt-1">
                  Zohľadnené vlastné úhrady: − {formatCurrency(summary.contributions.partner1PaidOutOfPocket)}
                </div>
              )}
            </div>
          </div>

          {/* Janka */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-amber-500/30 space-y-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-4 ring-amber-500/20" />
                <span className="text-sm font-semibold text-amber-300">
                  {p2.name}
                </span>
              </div>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                {(summary.contributions.partner2Ratio * 100).toFixed(1)} %
              </span>
            </div>

            <div>
              <div className="text-3xl font-bold font-mono text-amber-100">
                {formatCurrency(summary.contributions.partner2TransferToJoint)}
              </div>
              {summary.contributions.partner2PaidOutOfPocket > 0 && (
                <div className="text-xs text-amber-400/80 font-mono mt-1">
                  Zohľadnené vlastné úhrady: − {formatCurrency(summary.contributions.partner2PaidOutOfPocket)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Prehľadné štatistiky výdavkov */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-400 font-medium">Spolu výdavky</div>
          <div className="text-xl font-bold font-mono text-zinc-100 mt-1">
            {formatCurrency(summary.totalExpense)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 font-mono">
            Príjem: {formatCurrency(summary.currentMonthIncome.total)}
          </div>
        </div>

        <div className="bg-zinc-900 border border-sky-500/30 rounded-xl p-4 relative overflow-hidden">
          <div className="text-xs text-sky-400 font-medium flex items-center justify-between">
            <span>Spoločné</span>
            <span className="w-2 h-2 rounded-full bg-sky-400" />
          </div>
          <div className="text-xl font-bold font-mono text-sky-100 mt-1">
            {formatCurrency(summary.commonExpense)}
          </div>
          <div className="text-[11px] text-sky-400/80 mt-1 font-mono">
            {sharedPercent} % z výdavkov
          </div>
        </div>

        <div className="bg-zinc-900 border border-violet-500/30 rounded-xl p-4 relative overflow-hidden">
          <div className="text-xs text-violet-400 font-medium flex items-center justify-between">
            <span>{p1.name}</span>
            <span className="w-2 h-2 rounded-full bg-violet-400" />
          </div>
          <div className="text-xl font-bold font-mono text-violet-100 mt-1">
            {formatCurrency(summary.partner1PrivateExpense)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 font-mono">
            Súkromné
          </div>
        </div>

        <div className="bg-zinc-900 border border-amber-500/30 rounded-xl p-4 relative overflow-hidden">
          <div className="text-xs text-amber-400 font-medium flex items-center justify-between">
            <span>{p2.name}</span>
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-100 mt-1">
            {formatCurrency(summary.partner2PrivateExpense)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 font-mono">
            Súkromné
          </div>
        </div>
      </div>
    </div>
  );
};
