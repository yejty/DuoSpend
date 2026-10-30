import React from 'react';
import { 
  FileUp, 
  Camera, 
  Sparkles, 
  CreditCard, 
  BarChart3, 
  LayoutDashboard, 
  ReceiptText,
  Plus,
  TrendingUp
} from 'lucide-react';
import { PartnerProfile } from '../types';

interface HeaderProps {
  activeTab: 'overview' | 'accounts' | 'analytics' | 'transactions';
  setActiveTab: (tab: 'overview' | 'accounts' | 'analytics' | 'transactions') => void;
  partners: PartnerProfile[];
  onOpenPdfModal: () => void;
  onOpenReceiptModal: () => void;
  onOpenManualModal: () => void;
  onOpenIncomeModal: () => void;
  onOpenChatModal: () => void;
  onOpenSettingsModal: () => void;
  accountsCount: number;
  transactionsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  partners,
  onOpenPdfModal,
  onOpenReceiptModal,
  onOpenManualModal,
  onOpenIncomeModal,
  onOpenChatModal,
  onOpenSettingsModal,
  accountsCount,
  transactionsCount,
}) => {
  const p1 = partners.find(p => p.id === 'partner1') || partners[0];
  const p2 = partners.find(p => p.id === 'partner2') || partners[1];

  return (
    <header className="sticky top-0 z-30 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 text-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between py-3 gap-3">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-zinc-900 border border-zinc-700/80 flex items-center justify-center font-bold text-xs text-zinc-100">
              DS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold tracking-tight text-zinc-100">
                  DuoSpend
                </h1>
                <span className="text-[11px] text-zinc-500 font-normal">
                  • Spoločný účet páru
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick manual transaction */}
            <button
              onClick={onOpenManualModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition active:scale-95"
              title="Pridať manuálny výdavok alebo príjem"
            >
              <Plus className="w-3.5 h-3.5 text-zinc-950" />
              <span>Pridať transakciu</span>
            </button>

            {/* Monthly Income */}
            <button
              onClick={onOpenIncomeModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-medium transition"
              title="Mesačné príjmy a výpočet podielov"
            >
              <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
              <span>Mesačný príjem</span>
            </button>

            {/* Import PDF */}
            <button
              onClick={onOpenPdfModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition"
              title="Importovať bankový výpis PDF"
            >
              <FileUp className="w-3.5 h-3.5 text-zinc-400" />
              <span>Import výpisu</span>
            </button>

            {/* Photo receipt scan */}
            <button
              onClick={onOpenReceiptModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition"
              title="Odfotiť pokladničný doklad"
            >
              <Camera className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Bloček</span>
            </button>

            {/* AI Advisor Chat */}
            <button
              onClick={onOpenChatModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition"
              title="AI Poradca"
            >
              <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">AI Poradca</span>
            </button>

            {/* Partner profiles */}
            <button
              onClick={onOpenSettingsModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 transition"
              title="Nastavenia páru"
            >
              <span className="font-medium text-zinc-300">{p1.name} & {p2.name}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-t border-zinc-800/80 -mb-px overflow-x-auto scrollbar-none gap-2 pt-1 text-xs sm:text-sm">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 py-2 px-3 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-zinc-200 text-zinc-100'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Spoločný rozpočet</span>
          </button>

          <button
            onClick={() => setActiveTab('accounts')}
            className={`flex items-center gap-1.5 py-2 px-3 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'accounts'
                ? 'border-zinc-200 text-zinc-100'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Bankové účty</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
              {accountsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 py-2 px-3 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'border-zinc-200 text-zinc-100'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Grafy výdavkov</span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center gap-1.5 py-2 px-3 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'transactions'
                ? 'border-zinc-200 text-zinc-100'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <ReceiptText className="w-3.5 h-3.5" />
            <span>Transakcie</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
              {transactionsCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
