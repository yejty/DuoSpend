import React, { useState } from 'react';
import { 
  Building2, 
  X, 
  CheckCircle2, 
  RefreshCw, 
  ShieldCheck, 
  ArrowRight, 
  Plus, 
  Check, 
  ExternalLink,
  Sparkles,
  Lock
} from 'lucide-react';
import { BankAccount, OwnerId, PartnerProfile } from '../types';
import { formatCurrency } from '../utils/calculations';
import { getOwnerConfig } from '../utils/themeColors';

interface EnableBankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: BankAccount[];
  partners: PartnerProfile[];
  onSyncAccount: (accountId: string) => Promise<void>;
  onSyncAllAccounts: () => Promise<void>;
  onConnectNewBank: (bankData: {
    institution: string;
    accountName: string;
    ownerId: OwnerId;
    accountType: 'shared' | 'private';
    initialBalance: number;
    iban: string;
  }) => void;
}

const SUPPORTED_BANKS = [
  { id: 'tatra', name: 'Tatra banka', code: '1100', color: '#000000', badge: 'Raiffeisen Group' },
  { id: 'vub', name: 'VÚB banka', code: '0200', color: '#003882', badge: 'Intesa Sanpaolo' },
  { id: 'csob', name: 'ČSOB', code: '7500', color: '#0066b3', badge: 'KBC Group' },
  { id: 'slsp', name: 'Slovenská sporiteľňa', code: '0900', color: '#004f9e', badge: 'Erste Group' },
  { id: 'revolut', name: 'Revolut Bank', code: '3040', color: '#0075eb', badge: 'EEA PSD2' },
  { id: 'postova', name: '365.bank', code: '3650', color: '#00c389', badge: '365 Digital' },
  { id: 'mbank', name: 'mBank', code: '8360', color: '#ea0029', badge: 'mBank S.A.' },
  { id: 'fio', name: 'Fio banka', code: '8330', color: '#183884', badge: 'Fio Group' },
];

export const EnableBankingModal: React.FC<EnableBankingModalProps> = ({
  isOpen,
  onClose,
  accounts,
  partners,
  onSyncAccount,
  onSyncAllAccounts,
  onConnectNewBank,
}) => {
  const [activeStep, setActiveStep] = useState<'status' | 'connect'>('status');
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New connection form
  const [selectedBankId, setSelectedBankId] = useState('tatra');
  const [selectedOwner, setSelectedOwner] = useState<OwnerId>('joint');
  const [accountName, setAccountName] = useState('Nový spoločný účet');
  const [accountType, setAccountType] = useState<'shared' | 'private'>('shared');
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const p1 = partners.find(p => p.id === 'partner1') || { name: 'Daniel' };
  const p2 = partners.find(p => p.id === 'partner2') || { name: 'Janka' };

  if (!isOpen) return null;

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    setSuccessMessage(null);
    try {
      await onSyncAllAccounts();
      setSuccessMessage('Všetky bankové účty boli úspešne naživo synchronizované cez Enable Banking');
      setTimeout(() => setSuccessMessage(null), 4000);
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleSyncSingle = async (accountId: string) => {
    setSyncingId(accountId);
    try {
      await onSyncAccount(accountId);
      setSuccessMessage('Účet bol aktualizovaný cez živé čítanie');
      setTimeout(() => setSuccessMessage(null), 3000);
    } finally {
      setSyncingId(null);
    }
  };

  const handleAuthorizeAndConnect = () => {
    setIsAuthorizing(true);
    const bank = SUPPORTED_BANKS.find(b => b.id === selectedBankId) || SUPPORTED_BANKS[0];

    // Simulate PSD2 AISP authorization redirect & token fetch
    setTimeout(() => {
      const generatedIban = `SK${Math.floor(10 + Math.random() * 89)} ${bank.code} 0000 00${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;
      onConnectNewBank({
        institution: bank.name,
        accountName: accountName.trim() || `${bank.name} ${selectedOwner === 'joint' ? 'Spoločný' : selectedOwner === 'partner1' ? p1.name : p2.name}`,
        ownerId: selectedOwner,
        accountType: accountType,
        initialBalance: Math.round((800 + Math.random() * 2200) * 100) / 100,
        iban: generatedIban,
      });

      setIsAuthorizing(false);
      setActiveStep('status');
      setSuccessMessage(`Úspešne pripojené k ${bank.name} cez Enable Banking Open Banking API`);
      setTimeout(() => setSuccessMessage(null), 4000);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Enable Banking</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
                  PSD2 Live Sync
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Bezpečné živé čítanie zostatkov a transakcií zo slovenských bánk
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success toast */}
        {successMessage && (
          <div className="mt-3 p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Tab switch inside modal */}
        <div className="flex border-b border-neutral-800 mt-4 text-xs font-medium">
          <button
            onClick={() => setActiveStep('status')}
            className={`pb-2.5 px-3 border-b-2 transition ${
              activeStep === 'status'
                ? 'border-sky-400 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Pripojené účty
          </button>
          <button
            onClick={() => setActiveStep('connect')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeStep === 'connect'
                ? 'border-sky-400 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Pripojiť novú banku</span>
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {activeStep === 'status' ? (
            <>
              {/* Global sync action bar */}
              <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Aktívne PSD2 spojenie cez Enable Banking</span>
                  </div>
                  <div className="text-neutral-400 text-[11px] mt-0.5">
                    Čítanie je bezpečné, iba pre zobrazenie zostatkov a pohybov
                  </div>
                </div>
                <button
                  onClick={handleSyncAll}
                  disabled={isSyncingAll}
                  className="px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-neutral-950 font-semibold text-xs flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
                  <span>{isSyncingAll ? 'Synchronizujem...' : 'Synchronizovať všetky účty'}</span>
                </button>
              </div>

              {/* List of Connected Accounts */}
              <div className="space-y-2.5">
                <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider px-1">
                  Stav pripojených účtov
                </div>

                {accounts.map(acc => {
                  const ownerConf = getOwnerConfig(acc.ownerId);
                  const isSyncing = syncingId === acc.id;

                  return (
                    <div
                      key={acc.id}
                      className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between gap-3 hover:border-neutral-700 transition"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white truncate">
                            {acc.name}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] border ${ownerConf.badgeClass}`}>
                            {ownerConf.shortLabel}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-400 font-mono mt-1 flex flex-wrap items-center gap-2">
                          <span>{acc.institution}</span>
                          <span>•</span>
                          <span>{acc.accountNumberMask}</span>
                          <span>•</span>
                          <span className="text-emerald-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Live čítanie aktívne</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <div className="text-sm font-bold text-white font-mono">
                            {formatCurrency(acc.balance)}
                          </div>
                          <div className="text-[10px] text-neutral-500">
                            {acc.lastLiveSync || 'Aktuálny'}
                          </div>
                        </div>

                        <button
                          onClick={() => handleSyncSingle(acc.id)}
                          disabled={isSyncing}
                          className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition"
                          title="Načítať aktuálny zostatok"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-sky-400' : ''}`} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Connect New Bank Form */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-2">
                  1. Vyberte slovenskú banku
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SUPPORTED_BANKS.map(bank => {
                    const isSelected = selectedBankId === bank.id;
                    return (
                      <button
                        key={bank.id}
                        type="button"
                        onClick={() => {
                          setSelectedBankId(bank.id);
                          setAccountName(`${bank.name} ${selectedOwner === 'joint' ? 'Spoločný' : selectedOwner === 'partner1' ? p1.name : p2.name}`);
                        }}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                          isSelected
                            ? 'bg-sky-500/10 border-sky-500/50 shadow-sm'
                            : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Building2 className={`w-4 h-4 ${isSelected ? 'text-sky-400' : 'text-neutral-500'}`} />
                          {isSelected && <Check className="w-3.5 h-3.5 text-sky-400" />}
                        </div>
                        <div className="text-xs font-semibold text-white leading-tight">
                          {bank.name}
                        </div>
                        <div className="text-[10px] text-neutral-500 mt-0.5">
                          {bank.badge}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    2. Vlastník účtu
                  </label>
                  <select
                    value={selectedOwner}
                    onChange={(e) => {
                      const newOwner = e.target.value as OwnerId;
                      setSelectedOwner(newOwner);
                      const bank = SUPPORTED_BANKS.find(b => b.id === selectedBankId);
                      const bName = bank?.name || 'Účet';
                      setAccountName(`${bName} ${newOwner === 'joint' ? 'Spoločný' : newOwner === 'partner1' ? p1.name : p2.name}`);
                      setAccountType(newOwner === 'joint' ? 'shared' : 'private');
                    }}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-600"
                  >
                    <option value="joint">Spoločný účet páru</option>
                    <option value="partner1">{p1.name}</option>
                    <option value="partner2">{p2.name}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    3. Názov v aplikácii
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-600"
                    placeholder="napr. Tatra banka Spoločný"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80 text-xs text-neutral-400 space-y-1.5">
                <div className="flex items-center gap-2 text-neutral-200 font-medium">
                  <Lock className="w-3.5 h-3.5 text-sky-400" />
                  <span>Štandard PSD2 AISP</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Enable Banking vytvorí šifrovaný token s bankou. Aplikácia získava iba práva na čítanie pohybov a zostatku, žiadne platobné príkazy nemožno vykonať.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep('status')}
                  className="px-4 py-2 rounded-lg text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                >
                  Späť na zoznam
                </button>
                <button
                  type="button"
                  onClick={handleAuthorizeAndConnect}
                  disabled={isAuthorizing}
                  className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-neutral-950 font-semibold text-xs flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
                >
                  {isAuthorizing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Pripájam k banke...</span>
                    </>
                  ) : (
                    <>
                      <span>Autorizovať & pripojiť účet</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
