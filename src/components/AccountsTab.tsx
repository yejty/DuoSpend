import React, { useState } from 'react';
import { 
  Plus, 
  Share2, 
  Lock, 
  Users, 
  FileText, 
  Trash2, 
  Building2,
  FileUp
} from 'lucide-react';
import { AccountType, BankAccount, OwnerId, PartnerProfile, Transaction } from '../types';
import { formatCurrency } from '../utils/calculations';
import { getOwnerConfig } from '../utils/themeColors';

interface AccountsTabProps {
  accounts: BankAccount[];
  transactions: Transaction[];
  partners: PartnerProfile[];
  onToggleAccountType: (accountId: string) => void;
  onUpdateAccountOwner: (accountId: string, newOwnerId: OwnerId) => void;
  onDeleteAccount: (accountId: string) => void;
  onAddAccount: (newAccount: Omit<BankAccount, 'id'>) => void;
  onOpenPdfModal: () => void;
  onOpenEnableBankingModal?: () => void;
}

export const AccountsTab: React.FC<AccountsTabProps> = ({
  accounts,
  transactions,
  partners,
  onToggleAccountType,
  onUpdateAccountOwner,
  onDeleteAccount,
  onAddAccount,
  onOpenPdfModal,
  onOpenEnableBankingModal,
}) => {
  const [filterOwner, setFilterOwner] = useState<'all' | OwnerId>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const [newName, setNewName] = useState('');
  const [newInstitution, setNewInstitution] = useState('');
  const [newMask, setNewMask] = useState('');
  const [newOwner, setNewOwner] = useState<OwnerId>('partner1');
  const [newAccountType, setNewAccountType] = useState<AccountType>('private');
  const [newBalance, setNewBalance] = useState('1000.00');

  const p1 = partners.find(p => p.id === 'partner1') || partners[0];
  const p2 = partners.find(p => p.id === 'partner2') || partners[1];

  const filteredAccounts = accounts.filter(acc => {
    if (filterOwner === 'all') return true;
    return acc.ownerId === filterOwner;
  });

  const sharedAccounts = accounts.filter(a => a.accountType === 'shared');
  const privateAccounts = accounts.filter(a => a.accountType === 'private');

  const sharedTotalBalance = sharedAccounts.reduce((sum, a) => sum + a.balance, 0);
  const privateTotalBalance = privateAccounts.reduce((sum, a) => sum + a.balance, 0);

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newInstitution.trim()) return;

    onAddAccount({
      name: newName.trim(),
      institution: newInstitution.trim(),
      accountNumberMask: newMask.trim() ? `SK•• •••• ${newMask.slice(-4)}` : 'SK•• •••• 0000',
      ownerId: newOwner,
      accountType: newAccountType,
      currency: '€',
      balance: parseFloat(newBalance) || 0,
      color: newOwner === 'partner1' ? p1.avatarColor : newOwner === 'partner2' ? p2.avatarColor : '#0284c7',
      importedAt: new Date().toISOString().split('T')[0],
      enableBankingConnected: true,
      lastLiveSync: 'Live',
    });

    setNewName('');
    setNewInstitution('');
    setNewMask('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Enable Banking Live Integration Banner */}
      {onOpenEnableBankingModal && (
        <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Enable Banking Live API</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
                  PSD2 Aktívne
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Automatické živé čítanie zostatkov zo slovenských bánk: Tatra banka, VÚB, ČSOB, SLSP, Revolut
              </p>
            </div>
          </div>
          <button
            onClick={onOpenEnableBankingModal}
            className="px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-neutral-950 font-semibold text-xs flex items-center gap-2 transition active:scale-95 self-start sm:self-auto"
          >
            <span>Synchronizovať banky</span>
          </button>
        </div>
      )}

      {/* 3 Summary Cards with Owner Color Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-400">Celkový počet účtov</div>
          <div className="text-xl font-bold text-zinc-100 font-mono mt-1 flex items-center gap-2">
            <span>{accounts.length}</span>
            <span className="text-xs font-normal text-zinc-500">účtov</span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-2">
            <span className="flex items-center gap-1 text-violet-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              {p1.name}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-amber-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              {p2.name}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-sky-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              Spoločný pár
            </span>
          </div>
        </div>

        <div className="bg-zinc-900 border border-sky-500/30 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-sky-300">
            <span className="flex items-center gap-2 font-medium">
              <Share2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Spoločné účty</span>
              <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono text-[10px]">
                {sharedAccounts.length}
              </span>
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 font-mono">
              Domácnosť
            </span>
          </div>
          <div className="text-xl font-bold text-sky-100 font-mono mt-1">
            {formatCurrency(sharedTotalBalance)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            Spoločné financie na nájom a domácnosť
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-zinc-300">
            <span className="flex items-center gap-2 font-medium">
              <Lock className="w-3.5 h-3.5 text-zinc-400" />
              <span>Súkromné účty</span>
              <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono text-[10px]">
                {privateAccounts.length}
              </span>
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono">
              Osobné
            </span>
          </div>
          <div className="text-xl font-bold text-zinc-100 font-mono mt-1">
            {formatCurrency(privateTotalBalance)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Súkromné prostriedky partnerov
          </div>
        </div>
      </div>

      {/* Filter and Action Header with Owner Colors */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-900 p-3.5 rounded-xl border border-zinc-800">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-zinc-500 mr-1">Filter:</span>
          <button
            onClick={() => setFilterOwner('all')}
            className={`px-2.5 py-1 rounded-md transition flex items-center gap-1.5 ${
              filterOwner === 'all'
                ? 'bg-zinc-800 text-zinc-100 font-medium'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Všetky</span>
            <span className="px-1.5 py-0.2 rounded-full bg-zinc-700/80 text-zinc-200 text-[10px] font-mono">
              {accounts.length}
            </span>
          </button>
          <button
            onClick={() => setFilterOwner('partner1')}
            className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition ${
              filterOwner === 'partner1'
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40 font-medium'
                : 'text-zinc-400 hover:text-violet-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-violet-400" />
            <span>{p1.name}</span>
          </button>
          <button
            onClick={() => setFilterOwner('partner2')}
            className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition ${
              filterOwner === 'partner2'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium'
                : 'text-zinc-400 hover:text-amber-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>{p2.name}</span>
          </button>
          <button
            onClick={() => setFilterOwner('joint')}
            className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition ${
              filterOwner === 'joint'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-medium'
                : 'text-zinc-400 hover:text-sky-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span>Spoločný účet</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onOpenEnableBankingModal && (
            <button
              onClick={onOpenEnableBankingModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 text-xs font-semibold transition border border-sky-500/35"
              title="Živé pripojenie a synchronizácia slovenských bánk"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Enable Banking</span>
            </button>
          )}
          <button
            onClick={onOpenPdfModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition border border-zinc-700"
          >
            <FileUp className="w-3.5 h-3.5" />
            <span>Import výpisu</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nový účet</span>
          </button>
        </div>
      </div>

      {/* Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredAccounts.map((acc) => {
          const accountTxs = transactions.filter(t => t.accountId === acc.id);
          const isShared = acc.accountType === 'shared';
          const ownerConf = getOwnerConfig(acc.ownerId);

          return (
            <div 
              key={acc.id}
              className={`bg-zinc-900 border rounded-xl p-4 flex flex-col justify-between transition relative overflow-hidden ${
                isShared 
                  ? 'border-sky-500/30 shadow-sm' 
                  : acc.ownerId === 'partner1'
                  ? 'border-violet-500/30'
                  : 'border-amber-500/30'
              }`}
            >
              <div 
                className="absolute top-0 left-0 right-0 h-1" 
                style={{ backgroundColor: acc.color || ownerConf.hex }}
              />

              <div>
                <div className="flex items-start justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border"
                      style={{ 
                        backgroundColor: `${acc.color || ownerConf.hex}20`,
                        borderColor: `${acc.color || ownerConf.hex}40`,
                        color: acc.color || ownerConf.hex,
                      }}
                    >
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
                        <span>{acc.name}</span>
                      </h4>
                      <p className="text-[11px] text-zinc-500 font-mono">
                        {acc.institution} • {acc.accountNumberMask}
                      </p>
                    </div>
                  </div>

                  {/* Toggle button: Spoločný vs Súkromný */}
                  <button
                    onClick={() => onToggleAccountType(acc.id)}
                    title={`Kliknite pre zmenu na ${isShared ? 'Súkromný' : 'Spoločný'}`}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border transition ${
                      isShared
                        ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    {isShared ? (
                      <>
                        <Share2 className="w-2.5 h-2.5 text-sky-400" />
                        <span>Spoločný</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-2.5 h-2.5 text-zinc-400" />
                        <span>Súkromný</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Zostatok */}
                <div className="mt-3.5 p-3 rounded-lg bg-zinc-950 border border-zinc-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Zostatok:</span>
                    <span className="text-base font-bold text-zinc-100 font-mono">
                      {formatCurrency(acc.balance)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-1 pt-1 border-t border-zinc-900 font-mono">
                    <span>Počet položiek:</span>
                    <span className="px-2 py-0.5 rounded-full bg-neutral-900 text-neutral-300 font-mono text-[10px]">
                      {accountTxs.length} tx
                    </span>
                  </div>
                </div>

                {acc.lastLiveSync && (
                  <div className="mt-2 px-2.5 py-1 rounded bg-neutral-950 border border-neutral-900 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Live sync</span>
                    </span>
                    <span>{acc.lastLiveSync}</span>
                  </div>
                )}

                {/* Vlastník s farebným označením */}
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <span 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: acc.color || ownerConf.hex }} 
                    />
                    Vlastník:
                  </span>
                  <select
                    value={acc.ownerId}
                    onChange={(e) => onUpdateAccountOwner(acc.id, e.target.value as OwnerId)}
                    className="bg-zinc-950 border border-zinc-800 text-zinc-200 rounded px-2 py-1 text-xs focus:outline-none"
                  >
                    <option value="partner1">{p1.name}</option>
                    <option value="partner2">{p2.name}</option>
                    <option value="joint">Spoločný účet</option>
                  </select>
                </div>

                {acc.statementFileName && (
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] text-zinc-500 bg-zinc-950 px-2 py-1 rounded border border-zinc-900 truncate font-mono">
                    <FileText className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{acc.statementFileName}</span>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between">
                <span className={`text-[10px] px-1.5 py-0.2 rounded border font-mono ${ownerConf.bgClass}`}>
                  {acc.ownerId === 'joint' 
                    ? 'Spoločný účet' 
                    : acc.ownerId === 'partner1'
                    ? p1.name
                    : p2.name}
                </span>
                <button
                  onClick={() => onDeleteAccount(acc.id)}
                  title="Odstrániť účet"
                  className="p-1 text-zinc-600 hover:text-rose-400 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-4 shadow-2xl relative text-xs">
            <h3 className="text-sm font-semibold text-zinc-100 mb-1">Pridať bankový účet</h3>
            <p className="text-zinc-500 mb-3">
              Zadajte údaje o bankovom účte v mene EUR (€).
            </p>

            <form onSubmit={handleCreateAccount} className="space-y-3">
              <div>
                <label className="block text-zinc-400 mb-1">Názov účtu</label>
                <input
                  type="text"
                  placeholder="napr. Tatra banka Spoločný"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-zinc-400 mb-1">Banka</label>
                  <input
                    type="text"
                    placeholder="napr. Tatra banka"
                    value={newInstitution}
                    onChange={(e) => setNewInstitution(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Posledné 4 číslice IBAN</label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="4821"
                    value={newMask}
                    onChange={(e) => setNewMask(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-100 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-zinc-400 mb-1">Vlastník</label>
                  <select
                    value={newOwner}
                    onChange={(e) => setNewOwner(e.target.value as OwnerId)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-100 focus:outline-none"
                  >
                    <option value="partner1">{p1.name}</option>
                    <option value="partner2">{p2.name}</option>
                    <option value="joint">Spoločný účet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Klasifikácia</label>
                  <select
                    value={newAccountType}
                    onChange={(e) => setNewAccountType(e.target.value as AccountType)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-100 focus:outline-none"
                  >
                    <option value="shared">Spoločný účet</option>
                    <option value="private">Súkromný osobný</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Počiatočný zostatok (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-100 font-mono focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1 text-zinc-400 hover:text-zinc-200"
                >
                  Zrušiť
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-semibold"
                >
                  Uložiť
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
