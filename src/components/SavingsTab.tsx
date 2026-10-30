import { useState } from 'react';
import {
  Banknote,
  Coins,
  DollarSign,
  Landmark,
  Pencil,
  PiggyBank,
  Plus,
  Target,
  Trash2,
  TrendingUp,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { OwnerId, PartnerProfile, SavingsCategory, SavingsItem } from '../types';
import { OWNER_COLORS, SAVINGS_CATEGORY_COLORS } from '../utils/themeColors';

interface SavingsTabProps {
  savings: SavingsItem[];
  partners: PartnerProfile[];
  onAddSavings: (item: Omit<SavingsItem, 'id' | 'lastUpdated'>) => void;
  onUpdateSavings: (id: string, updates: Partial<SavingsItem>) => void;
  onDeleteSavings: (id: string) => void;
}

export function SavingsTab({
  savings,
  partners,
  onAddSavings,
  onUpdateSavings,
  onDeleteSavings,
}: SavingsTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedOwner, setSelectedOwner] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SavingsItem | null>(null);

  // Quick balance edit modal state
  const [quickBalanceItem, setQuickBalanceItem] = useState<SavingsItem | null>(null);
  const [quickBalanceVal, setQuickBalanceVal] = useState<string>('');

  // Form state
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<SavingsCategory>('Rezerva');
  const [formOwnerId, setFormOwnerId] = useState<OwnerId>('joint');
  const [formCurrentAmount, setFormCurrentAmount] = useState('');
  const [formTargetAmount, setFormTargetAmount] = useState('');
  const [formMonthlyContribution, setFormMonthlyContribution] = useState('');
  const [formInstitution, setFormInstitution] = useState('');
  const [formNote, setFormNote] = useState('');

  const partner1 = partners.find(p => p.id === 'partner1') || { name: 'Daniel' };
  const partner2 = partners.find(p => p.id === 'partner2') || { name: 'Janka' };

  // Calculate totals
  const totalSavings = savings.reduce((acc, item) => acc + item.currentAmount, 0);
  const totalTarget = savings.reduce((acc, item) => acc + (item.targetAmount || 0), 0);
  const totalMonthly = savings.reduce((acc, item) => acc + (item.monthlyContribution || 0), 0);

  const reserveTotal = savings
    .filter(s => s.category === 'Rezerva')
    .reduce((acc, s) => acc + s.currentAmount, 0);

  const investTotal = savings
    .filter(s => s.category === 'Investície')
    .reduce((acc, s) => acc + s.currentAmount, 0);

  const retirementTotal = savings
    .filter(s => s.category === 'Dôchodok')
    .reduce((acc, s) => acc + s.currentAmount, 0);

  const goalsTotal = savings
    .filter(s => s.category === 'Ciele')
    .reduce((acc, s) => acc + s.currentAmount, 0);

  // Filtered items
  const filteredItems = savings.filter(item => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (selectedOwner !== 'all' && item.ownerId !== selectedOwner) return false;
    return true;
  });

  const openAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategory('Rezerva');
    setFormOwnerId('joint');
    setFormCurrentAmount('');
    setFormTargetAmount('');
    setFormMonthlyContribution('');
    setFormInstitution('');
    setFormNote('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: SavingsItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormOwnerId(item.ownerId);
    setFormCurrentAmount(item.currentAmount.toString());
    setFormTargetAmount(item.targetAmount ? item.targetAmount.toString() : '');
    setFormMonthlyContribution(item.monthlyContribution ? item.monthlyContribution.toString() : '');
    setFormInstitution(item.institutionOrAccount || '');
    setFormNote(item.note || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || isNaN(parseFloat(formCurrentAmount))) return;

    const currentVal = parseFloat(formCurrentAmount) || 0;
    const targetVal = formTargetAmount ? parseFloat(formTargetAmount) : undefined;
    const monthlyVal = formMonthlyContribution ? parseFloat(formMonthlyContribution) : undefined;

    if (editingItem) {
      onUpdateSavings(editingItem.id, {
        name: formName.trim(),
        category: formCategory,
        ownerId: formOwnerId,
        currentAmount: currentVal,
        targetAmount: targetVal,
        monthlyContribution: monthlyVal,
        institutionOrAccount: formInstitution.trim() || undefined,
        note: formNote.trim() || undefined,
        lastUpdated: new Date().toISOString().slice(0, 10),
      });
    } else {
      onAddSavings({
        name: formName.trim(),
        category: formCategory,
        ownerId: formOwnerId,
        currentAmount: currentVal,
        targetAmount: targetVal,
        monthlyContribution: monthlyVal,
        institutionOrAccount: formInstitution.trim() || undefined,
        note: formNote.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  };

  const handleQuickBalanceSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickBalanceItem) return;
    const newAmount = parseFloat(quickBalanceVal);
    if (isNaN(newAmount)) return;

    onUpdateSavings(quickBalanceItem.id, {
      currentAmount: newAmount,
      lastUpdated: new Date().toISOString().slice(0, 10),
    });
    setQuickBalanceItem(null);
  };

  const getOwnerLabel = (ownerId: OwnerId) => {
    if (ownerId === 'partner1') return partner1.name;
    if (ownerId === 'partner2') return partner2.name;
    return 'Spoločný účet';
  };

  const getOwnerBadgeClasses = (ownerId: OwnerId) => {
    if (ownerId === 'partner1') return OWNER_COLORS.partner1.badgeClass;
    if (ownerId === 'partner2') return OWNER_COLORS.partner2.badgeClass;
    return OWNER_COLORS.joint.badgeClass;
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-emerald-400" />
            Sporenie, ciele a investície
          </h2>
          <p className="text-sm text-neutral-400 mt-0.5">
            Prehľad a zadávanie úspor, cieľov sporenia, núdzovej rezervy a investícií
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-medium rounded-lg text-sm transition-colors shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Pridať cieľ / sporenie
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="col-span-2 md:col-span-1 bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Celkový majetok</span>
            <Landmark className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {totalSavings.toLocaleString('sk-SK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
          </div>
          <div className="text-xs text-neutral-400 mt-1">
            Vklad: <span className="text-emerald-400 font-medium">+{totalMonthly.toFixed(0)} €</span> / mesiac
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Rezerva</span>
            <ShieldCheck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl font-bold text-sky-400">
            {reserveTotal.toLocaleString('sk-SK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
          </div>
          <div className="text-xs text-neutral-500 mt-1">Pohotovostný fond</div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Investície</span>
            <TrendingUp className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-xl font-bold text-violet-400">
            {investTotal.toLocaleString('sk-SK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
          </div>
          <div className="text-xs text-neutral-500 mt-1">ETF, akcie, fondy</div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Dôchodok</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400">
            {retirementTotal.toLocaleString('sk-SK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
          </div>
          <div className="text-xs text-neutral-500 mt-1">2. a 3. pilier</div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Ciele</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400">
            {goalsTotal.toLocaleString('sk-SK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
          </div>
          <div className="text-xs text-neutral-500 mt-1">Dovolenka, bývanie...</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-neutral-400 font-medium mr-1">Kategória:</span>
          {(['all', 'Rezerva', 'Investície', 'Dôchodok', 'Ciele', 'Iné'] as const).map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-neutral-800 text-white border border-neutral-700'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                }`}
              >
                {cat === 'all' ? 'Všetky kategórie' : cat}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-800">
          <span className="text-xs text-neutral-400 font-medium">Vlastník:</span>
          <select
            value={selectedOwner}
            onChange={e => setSelectedOwner(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-neutral-600"
          >
            <option value="all">Všetci (Daniel, Janka, Spoločný)</option>
            <option value="joint">Iba Spoločný účet</option>
            <option value="partner1">Iba {partner1.name}</option>
            <option value="partner2">Iba {partner2.name}</option>
          </select>
        </div>
      </div>

      {/* Savings Grid Cards */}
      {filteredItems.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center">
          <PiggyBank className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
          <h3 className="text-base font-medium text-white mb-1">Žiadne záznamy sporenia</h3>
          <p className="text-sm text-neutral-400 max-w-sm mx-auto mb-4">
            Zatiaľ nemáte evidované žiadne sporenie alebo investície podľa zvolených filtrov.
          </p>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-lg text-sm font-medium"
          >
            Pridať prvý cieľ alebo sporenie
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => {
            const catStyle = SAVINGS_CATEGORY_COLORS[item.category] || SAVINGS_CATEGORY_COLORS['Iné'];
            const ownerBadge = getOwnerBadgeClasses(item.ownerId);
            const progress = item.targetAmount
              ? Math.min(100, Math.round((item.currentAmount / item.targetAmount) * 100))
              : null;

            return (
              <div
                key={item.id}
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between hover:border-neutral-700 transition-colors"
              >
                <div>
                  {/* Card Header: Category & Owner */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium border ${catStyle.bgClass} ${catStyle.textClass} ${catStyle.borderClass}`}
                    >
                      {item.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${ownerBadge}`}>
                      {getOwnerLabel(item.ownerId)}
                    </span>
                  </div>

                  {/* Title & Institution */}
                  <h3 className="text-base font-semibold text-white leading-snug">{item.name}</h3>
                  {item.institutionOrAccount && (
                    <div className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1">
                      <Landmark className="w-3 h-3 text-neutral-500" />
                      {item.institutionOrAccount}
                    </div>
                  )}

                  {/* Balance Display */}
                  <div className="mt-4 mb-2 flex items-baseline justify-between">
                    <div>
                      <div className="text-xs text-neutral-400">Aktuálny zostatok</div>
                      <div className="text-2xl font-bold text-white tracking-tight">
                        {item.currentAmount.toLocaleString('sk-SK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €
                      </div>
                    </div>
                    {item.monthlyContribution && item.monthlyContribution > 0 && (
                      <div className="text-right">
                        <div className="text-xs text-neutral-400">Mesačný vklad</div>
                        <div className="text-sm font-semibold text-emerald-400">
                          +{item.monthlyContribution.toFixed(0)} €
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar (if target) */}
                  {item.targetAmount && item.targetAmount > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-neutral-400 mb-1">
                        <span>Cieľ: {item.targetAmount.toLocaleString('sk-SK')} €</span>
                        <span className="font-medium text-neutral-200">{progress}%</span>
                      </div>
                      <div className="h-2 w-full bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Note */}
                  {item.note && (
                    <p className="text-xs text-neutral-400 mt-3 italic line-clamp-2 bg-neutral-950/50 p-2 rounded border border-neutral-800/60">
                      {item.note}
                    </p>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                  <span className="text-neutral-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {item.lastUpdated || 'Nedávno'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setQuickBalanceItem(item);
                        setQuickBalanceVal(item.currentAmount.toString());
                      }}
                      className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                      title="Rýchla zmena zostatku"
                    >
                      Zmeniť sumu
                    </button>
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                      title="Upraviť položku"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Naozaj vymazať sporenie "${item.name}"?`)) {
                          onDeleteSavings(item.id);
                        }
                      }}
                      className="p-1 rounded text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Vymazať"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Balance Update Modal */}
      {quickBalanceItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-sm w-full p-5 shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-1">
              Aktualizovať zostatok
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              {quickBalanceItem.name} ({getOwnerLabel(quickBalanceItem.ownerId)})
            </p>

            <form onSubmit={handleQuickBalanceSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Nový zostatok (€)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    required
                    autoFocus
                    value={quickBalanceVal}
                    onChange={e => setQuickBalanceVal(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white text-lg font-bold pr-8 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="absolute right-3 top-2.5 text-neutral-500 font-bold">€</span>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setQuickBalanceItem(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:bg-neutral-800"
                >
                  Zrušiť
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-medium bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold"
                >
                  Uložiť zostatok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Full Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">
              {editingItem ? 'Upraviť cieľ / sporenie' : 'Nový cieľ alebo sporenie'}
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Zadajte cieľovú sumu a mesačný vklad pre rezervu, investície, dovolenku alebo dôchodok.
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Názov sporenia / účtu *
                </label>
                <input
                  type="text"
                  required
                  placeholder="napr. ETF S&P 500, Pohotovostná rezerva, 3. pilier..."
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Kategória
                  </label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as SavingsCategory)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-600"
                  >
                    <option value="Rezerva">Rezerva (núdzový fond)</option>
                    <option value="Investície">Investície (ETF, akcie)</option>
                    <option value="Dôchodok">Dôchodok (2. a 3. pilier)</option>
                    <option value="Ciele">Ciele (dovolenka, auto...)</option>
                    <option value="Iné">Iné</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Vlastník
                  </label>
                  <select
                    value={formOwnerId}
                    onChange={e => setFormOwnerId(e.target.value as OwnerId)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-600"
                  >
                    <option value="joint">Spoločný účet</option>
                    <option value="partner1">{partner1.name}</option>
                    <option value="partner2">{partner2.name}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Banka / Finančná inštitúcia
                </label>
                <input
                  type="text"
                  placeholder="napr. Tatra banka, Finax, XTB, Uniqa DDS, NN..."
                  value={formInstitution}
                  onChange={e => setFormInstitution(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Aktuálny zostatok (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0"
                    value={formCurrentAmount}
                    onChange={e => setFormCurrentAmount(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white font-semibold focus:outline-none focus:border-neutral-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Cieľová suma (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Nepovinné"
                    value={formTargetAmount}
                    onChange={e => setFormTargetAmount(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-600"
                  />
                  <span className="text-[10px] text-neutral-500 block mt-1">Cieľová čiastka</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Vklad (€ / mesiac)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={formMonthlyContribution}
                    onChange={e => setFormMonthlyContribution(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-600"
                  />
                  <span className="text-[10px] text-neutral-500 block mt-1">Určuje cieľ v grafe</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Poznámka / Účel
                </label>
                <textarea
                  rows={2}
                  placeholder="napr. 6 mesiacov životných nákladov, sporenie na letnú dovolenku..."
                  value={formNote}
                  onChange={e => setFormNote(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-600"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  Zrušiť
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-neutral-950 transition-colors"
                >
                  {editingItem ? 'Uložiť zmeny' : 'Pridať sporenie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
