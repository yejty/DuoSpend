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

interface AccountsTabProps {
  accounts: BankAccount[];
  transactions: Transaction[];
  partners: PartnerProfile[];
  onToggleAccountType: (accountId: string) => void;
  onUpdateAccountOwner: (accountId: string, newOwnerId: OwnerId) => void;
  onDeleteAccount: (accountId: string) => void;
  onAddAccount: (newAccount: Omit<BankAccount, 'id'>) => void;
  onOpenPdfModal: () => void;
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
      color: newOwner === 'partner1' ? p1.avatarColor : newOwner === 'partner2' ? p2.avatarColor : '#52525b',
      importedAt: new Date().toISOString().split('T')[0],
    });

    setNewName('');
    setNewInstitution('');
    setNewMask('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-400">Celkový počet účtov</div>
          <div className="text-xl font-bold text-zinc-100 font-mono mt-1">
            {accounts.length}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            {p1.name}, {p2.name} a Spoločný pár
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-zinc-300">
            <span className="flex items-center gap-1.5 font-medium">
              <Share2 className="w-3.5 h-3.5" /> Spoločné účty ({sharedAccounts.length})
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono">
              Domácnosť
            </span>
          </div>
          <div className="text-xl font-bold text-zinc-100 font-mono mt-1">
            {formatCurrency(sharedTotalBalance)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Spoločné výdavky páru
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-zinc-300">
            <span className="flex items-center gap-1.5 font-medium">
              <Lock className="w-3.5 h-3.5 text-zinc-400" /> Súkromné účty ({privateAccounts.length})
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

      {/* Filter and Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-900 p-3.5 rounded-xl border border-zinc-800">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-zinc-500 mr-1">Filter:</span>
          <button
            onClick={() => setFilterOwner('all')}
            className={`px-2.5 py-1 rounded-md transition ${
              filterOwner === 'all'
                ? 'bg-zinc-800 text-zinc-100 font-medium'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Všetky ({accounts.length})
          </button>
          <button
            onClick={() => setFilterOwner('partner1')}
            className={`px-2.5 py-1 rounded-md transition ${
              filterOwner === 'partner1'
                ? 'bg-zinc-800 text-zinc-100 font-medium'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {p1.name}
          </button>
          <button
            onClick={() => setFilterOwner('partner2')}
            className={`px-2.5 py-1 rounded-md transition ${
              filterOwner === 'partner2'
                ? 'bg-zinc-800 text-zinc-100 font-medium'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {p2.name}
          </button>
          <button
            onClick={() => setFilterOwner('joint')}
            className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition ${
              filterOwner === 'joint'
                ? 'bg-zinc-800 text-zinc-100 font-medium'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-3 h-3" />
            Spoločné
          </button>
        </div>

        <div className="flex items-center gap-2">
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

          return (
            <div 
              key={acc.id}
              className={`bg-zinc-900 border rounded-xl p-4 flex flex-col justify-between transition ${
                isShared ? 'border-zinc-700' : 'border-zinc-800'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-300 text-xs">
                      <Building2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-100">
                        {acc.name}
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
                        ? 'bg-zinc-800 text-zinc-100 border-zinc-600'
                        : 'bg-zinc-950 text-zinc-500 border-zinc-800'
                    }`}
                  >
                    {isShared ? (
                      <>
                        <Share2 className="w-2.5 h-2.5 text-zinc-300" />
                        <span>Spoločný</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-2.5 h-2.5 text-zinc-500" />
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
                    <span>{accountTxs.length}</span>
                  </div>
                </div>

                {/* Vlastník */}
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Vlastník:</span>
                  <select
                    value={acc.ownerId}
                    onChange={(e) => onUpdateAccountOwner(acc.id, e.target.value as OwnerId)}
                    className="bg-zinc-950 border border-zinc-800 text-zinc-200 rounded px-2 py-1 text-xs focus:outline-none"
                  >
                    <option value="partner1">{p1.name} (Partner 1)</option>
                    <option value="partner2">{p2.name} (Partner 2)</option>
                    <option value="joint">Spoločný pár</option>
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
                <span className="text-[10px] text-zinc-500">
                  {isShared ? 'Spoločné pre domácnosť' : 'Súkromné osobné'}
                </span>
                <button
                  onClick={() => onDeleteAccount(acc.id)}
                  title="Odstrániť účet"
                  className="p-1 text-zinc-600 hover:text-zinc-300 transition"
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
                    <option value="partner1">{p1.name} (Partner 1)</option>
                    <option value="partner2">{p2.name} (Partner 2)</option>
                    <option value="joint">Spoločný pár</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Klasifikácia</label>
                  <select
                    value={newAccountType}
                    onChange={(e) => setNewAccountType(e.target.value as AccountType)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-100 focus:outline-none"
                  >
                    <option value="shared">Spoločný pár</option>
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
