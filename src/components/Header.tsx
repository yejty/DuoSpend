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
  TrendingUp,
  PiggyBank
} from 'lucide-react';
import { PartnerProfile } from '../types';

interface HeaderProps {
  activeTab: 'overview' | 'accounts' | 'analytics' | 'trends' | 'transactions' | 'savings';
  setActiveTab: (tab: 'overview' | 'accounts' | 'analytics' | 'trends' | 'transactions' | 'savings') => void;
  partners: PartnerProfile[];
  onOpenPdfModal: () => void;
  onOpenReceiptModal: () => void;
  onOpenManualModal: () => void;
  onOpenIncomeModal: () => void;
  onOpenChatModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenEnableBankingModal: () => void;
  onOpenWarrantyModal: () => void;
  accountsCount: number;
  transactionsCount: number;
  savingsCount?: number;
  warrantiesCount?: number;
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
  onOpenEnableBankingModal,
  onOpenWarrantyModal,
  accountsCount,
  transactionsCount,
  savingsCount = 0,
  warrantiesCount = 0,
}) => {
  const p1 = partners.find(p => p.id === 'partner1') || { name: 'Daniel', avatarColor: '#8b5cf6' };
  const p2 = partners.find(p => p.id === 'partner2') || { name: 'Janka', avatarColor: '#f59e0b' };

  return (
    <header className="sticky top-0 z-30 bg-neutral-950/95 backdrop-blur border-b border-neutral-800 text-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between py-3 gap-3">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-bold text-xs text-emerald-400">
              DS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold tracking-tight text-white">
                  DuoSpend
                </h1>
                <span className="text-[11px] text-neutral-500 font-normal">
                  • Spoločný účet páru
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick manual transaction (cash or card) */}
            <button
              onClick={onOpenManualModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-semibold transition active:scale-95"
              title="Pridať výdavok v hotovosti alebo kartou"
            >
              <Plus className="w-3.5 h-3.5 text-neutral-950" />
              <span>Pridať transakciu</span>
            </button>

            {/* Enable Banking Live Connect */}
            <button
              onClick={onOpenEnableBankingModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/35 text-sky-300 text-xs font-semibold transition active:scale-95"
              title="Enable Banking: živé čítanie zo slovenských bánk"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Enable Banking</span>
            </button>

            {/* Photo receipt scan */}
            <button
              onClick={onOpenReceiptModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs font-medium transition"
              title="Odfotiť bloček s možnosťou evidencie záruky"
            >
              <Camera className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden sm:inline">Odfotiť bloček</span>
            </button>

            {/* Warranties & Claims Archive */}
            <button
              onClick={onOpenWarrantyModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs font-medium transition"
              title="Archív účteniek pre reklamáciu a záruky tovaru"
            >
              <span className="hidden sm:inline">Záruky tovaru</span>
              {warrantiesCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                  {warrantiesCount}
                </span>
              )}
            </button>

            {/* Monthly Income */}
            <button
              onClick={onOpenIncomeModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs font-medium transition"
              title="Mesačné príjmy a výpočet podielov"
            >
              <TrendingUp className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden md:inline">Príjem</span>
            </button>

            {/* Import PDF */}
            <button
              onClick={onOpenPdfModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs font-medium transition"
              title="Importovať bankový výpis PDF"
            >
              <FileUp className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden lg:inline">Import</span>
            </button>

            {/* Partner profiles */}
            <button
              onClick={onOpenSettingsModal}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-300 transition"
              title="Nastavenia profilov páru"
            >
              <div className="flex items-center -space-x-1">
                <span
                  className="w-2.5 h-2.5 rounded-full ring-2 ring-neutral-900"
                  style={{ backgroundColor: p1.avatarColor || '#8b5cf6' }}
                  title={p1.name}
                />
                <span
                  className="w-2.5 h-2.5 rounded-full ring-2 ring-neutral-900"
                  style={{ backgroundColor: p2.avatarColor || '#f59e0b' }}
                  title={p2.name}
                />
              </div>
              <span className="font-medium text-white">
                <span className="text-violet-400">{p1.name}</span> & <span className="text-amber-400">{p2.name}</span>
              </span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-t border-neutral-800/80 -mb-px overflow-x-auto scrollbar-none gap-2 pt-1 text-xs sm:text-sm">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 py-2 px-3 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-emerald-400 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Spoločný rozpočet</span>
          </button>

          <button
            onClick={() => setActiveTab('accounts')}
            className={`flex items-center gap-1.5 py-2 px-3 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'accounts'
                ? 'border-emerald-400 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Bankové účty</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono">
              {accountsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 py-2 px-3 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'border-emerald-400 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Grafy výdavkov</span>
          </button>

          <button
            onClick={() => setActiveTab('trends')}
            className={`flex items-center gap-1.5 py-2 px-3 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'trends'
                ? 'border-emerald-400 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
            <span>Trendy výdavkov</span>
          </button>

          <button
            onClick={() => setActiveTab('savings')}
            className={`flex items-center gap-1.5 py-2 px-3 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'savings'
                ? 'border-emerald-400 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <PiggyBank className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sporenie & ciele</span>
            {savingsCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono">
                {savingsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center gap-1.5 py-2 px-3 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'transactions'
                ? 'border-emerald-400 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ReceiptText className="w-3.5 h-3.5" />
            <span>Transakcie</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono">
              {transactionsCount} tx
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
