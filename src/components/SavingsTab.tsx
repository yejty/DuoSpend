import React, { useState } from 'react';
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
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { OwnerId, PartnerProfile, SavingsCategory, SavingsItem } from '../types';
import { OWNER_COLORS, SAVINGS_CATEGORY_COLORS } from '../utils/themeColors';
import { formatCurrency } from '../utils/calculations';

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
  const [formYearlyTarget, setFormYearlyTarget] = useState('');
  const [formInstitution, setFormInstitution] = useState('');
  const [formNote, setFormNote] = useState('');

  const partner1 = partners.find(p => p.id === 'partner1') || { name: 'Daniel' };
  const partner2 = partners.find(p => p.id === 'partner2') || { name: 'Janka' };

  // Calculate totals
  const totalSavings = savings.reduce((acc, item) => acc + item.currentAmount, 0);
  const totalTarget = savings.reduce((acc, item) => acc + (item.targetAmount || 0), 0);
  const totalMonthly = savings.reduce((acc, item) => acc + (item.monthlyContribution || 0), 0);
  const totalYearly = savings.reduce((acc, item) => acc + (item.yearlyTarget || (item.monthlyContribution ? item.monthlyContribution * 12 : 0)), 0);

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
    setFormYearlyTarget('');
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
    setFormYearlyTarget(item.yearlyTarget ? item.yearlyTarget.toString() : (item.monthlyContribution ? (item.monthlyContribution * 12).toString() : ''));
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
    const yearlyVal = formYearlyTarget ? parseFloat(formYearlyTarget) : (monthlyVal ? monthlyVal * 12 : undefined);

    if (editingItem) {
      onUpdateSavings(editingItem.id, {
        name: formName.trim(),
        category: formCategory,
        ownerId: formOwnerId,
        currentAmount: currentVal,
        targetAmount: targetVal,
        monthlyContribution: monthlyVal,
        yearlyTarget: yearlyVal,
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
        yearlyTarget: yearlyVal,
        currentMonthSaved: monthlyVal || 0,
        institutionOrAccount: formInstitution.trim() || undefined,
        note: formNote.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  };

  const handleDepositMonthly = (item: SavingsItem) => {
    const contribution = item.monthlyContribution || 50;
    onUpdateSavings(item.id, {
      currentAmount: item.currentAmount + contribution,
      currentMonthSaved: (item.currentMonthSaved || 0) + contribution,
      lastUpdated: new Date().toISOString().slice(0, 10),
    });
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
            Sporenie a ciele
          </h2>
          <p className="text-sm text-neutral-400 mt-0.5">
            Plánovanie mesačných a ročných cieľov, núdzovej rezervy a investícií
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-medium rounded-lg text-sm transition-colors shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Pridať cieľ a sporenie
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="col-span-2 md:col-span-1 bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Celkový majetok</span>
            <Landmark className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {formatCurrency(totalSavings)}
          </div>
          <div className="text-xs text-neutral-400 mt-1 font-mono">
            Cieľ: <span className="text-emerald-400 font-semibold">+{totalMonthly.toFixed(0)} €</span> / mesiac
          </div>
        </div>

        {/* Rezerva - TEAL */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Rezerva</span>
            <ShieldCheck className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl font-bold text-teal-400 font-mono">
            {formatCurrency(reserveTotal)}
          </div>
          <div className="text-xs text-neutral-500 mt-1">Pohotovostný fond</div>
        </div>

        {/* Investície - EMERALD */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Investície</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono">
            {formatCurrency(investTotal)}
          </div>
          <div className="text-xs text-neutral-500 mt-1">ETF fondy a akcie</div>
        </div>

        {/* Dôchodok - ROSE */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Dôchodok</span>
            <Coins className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-rose-400 font-mono">
            {formatCurrency(retirementTotal)}
          </div>
          <div className="text-xs text-neutral-500 mt-1">Dôchodkové piliere</div>
        </div>

        {/* Ciele - LIME */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Ciele</span>
            <Target className="w-4 h-4 text-lime-400" />
          </div>
          <div className="text-xl font-bold text-lime-400 font-mono">
            {formatCurrency(goalsTotal)}
          </div>
          <div className="text-xs text-neutral-500 mt-1">Dovolenka a bývanie</div>
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
            <option value="all">Všetci vlastníci</option>
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

            const monthlyGoal = item.monthlyContribution || 0;
            const yearlyGoal = item.yearlyTarget || (monthlyGoal > 0 ? monthlyGoal * 12 : 0);
            const monthSaved = item.currentMonthSaved ?? monthlyGoal;
            const isMonthlyMet = monthlyGoal > 0 && monthSaved >= monthlyGoal;

            return (
              <div
                key={item.id}
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between hover:border-neutral-700 transition-colors"
              >
                <div>
                  {/* Card Header: Category & Owner */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold border ${catStyle.bgClass} ${catStyle.textClass} ${catStyle.borderClass}`}
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

                  {/* Current Balance */}
                  <div className="mt-4 mb-2 flex items-baseline justify-between">
                    <div>
                      <div className="text-xs text-neutral-400">Aktuálny zostatok</div>
                      <div className="text-2xl font-bold text-white tracking-tight font-mono">
                        {formatCurrency(item.currentAmount)}
                      </div>
                    </div>
                  </div>

                  {/* Monthly & Yearly Target Tracker */}
                  <div className="mt-3 p-2.5 rounded-lg bg-neutral-950/70 border border-neutral-800/80 space-y-2 text-xs">
                    {/* Monthly Target Row */}
                    {monthlyGoal > 0 ? (
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-neutral-500" />
                            <span>Mesačný cieľ:</span>
                          </span>
                          <span className="font-mono font-bold text-emerald-400">
                            +{monthlyGoal.toFixed(0)} € / mesiac
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-1">
                          <span>Plnenie tento mesiac:</span>
                          {isMonthlyMet ? (
                            <span className="text-emerald-400 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Splnené 100 %</span>
                            </span>
                          ) : (
                            <span className="text-neutral-300 font-mono">
                              {monthSaved} € z {monthlyGoal} €
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-neutral-500 italic">
                        Mesačný vklad neurčený
                      </div>
                    )}

                    {/* Yearly Target Row */}
                    {yearlyGoal > 0 && (
                      <div className="pt-2 border-t border-neutral-800/80">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-neutral-400 flex items-center gap-1">
                            <Target className="w-3 h-3 text-lime-400" />
                            <span>Ročný cieľ:</span>
                          </span>
                          <span className="font-mono font-semibold text-lime-400">
                            {formatCurrency(yearlyGoal)} / rok
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden border border-neutral-800 mt-1.5">
                          <div
                            className="h-full bg-lime-500 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.round((item.currentAmount / yearlyGoal) * 100))}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Quick Deposit Button */}
                    {monthlyGoal > 0 && (
                      <button
                        onClick={() => handleDepositMonthly(item)}
                        className="w-full mt-1.5 py-1 px-2 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Pridať mesačný vklad +{monthlyGoal.toFixed(0)} €</span>
                      </button>
                    )}
                  </div>

                  {/* Progress Bar (Overall Target) */}
                  {item.targetAmount && item.targetAmount > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-neutral-400 mb-1">
                        <span>Celkový cieľ: {formatCurrency(item.targetAmount)}</span>
                        <span className="font-medium text-neutral-200 font-mono">{progress}%</span>
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
                  <span className="text-neutral-500 flex items-center gap-1 text-[11px]">
                    <Calendar className="w-3 h-3" />
                    {item.lastUpdated || 'Nedávno'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setQuickBalanceItem(item);
                        setQuickBalanceVal(item.currentAmount.toString());
                      }}
                      className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors text-xs"
                      title="Rýchla zmena zostatku"
                    >
                      Zmeniť sumu
                    </button>
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                      title="Upraviť cieľ"
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
              {quickBalanceItem.name} • {getOwnerLabel(quickBalanceItem.ownerId)}
            </p>

            <form onSubmit={handleQuickBalanceSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Nový zostatok v €
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
              {editingItem ? 'Upraviť cieľ a sporenie' : 'Nový cieľ a sporenie'}
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Zadajte mesačný a ročný cieľ pre rezervu, investície, dovolenku alebo dôchodok.
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Názov sporenia alebo cieľa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="napr. Sporenie na letnú dovolenku, Pohotovostná rezerva..."
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
                    <option value="Rezerva">Rezerva • núdzový fond</option>
                    <option value="Investície">Investície • ETF a akcie</option>
                    <option value="Dôchodok">Dôchodok • 2. a 3. pilier</option>
                    <option value="Ciele">Ciele • dovolenka, auto</option>
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
                  Banka alebo finančná inštitúcia
                </label>
                <input
                  type="text"
                  placeholder="napr. Tatra banka, Finax, XTB, Uniqa DDS, NN..."
                  value={formInstitution}
                  onChange={e => setFormInstitution(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-600"
                />
              </div>

              {/* Targets grid: Current balance, Monthly goal, Yearly goal, Total target */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Aktuálny zostatok v € *
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
                    Celkový cieľ v €
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="napr. 2500"
                    value={formTargetAmount}
                    onChange={e => setFormTargetAmount(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Mesačný cieľ v € / mesiac
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="napr. 50"
                    value={formMonthlyContribution}
                    onChange={e => {
                      setFormMonthlyContribution(e.target.value);
                      if (e.target.value && !formYearlyTarget) {
                        setFormYearlyTarget((parseFloat(e.target.value) * 12).toString());
                      }
                    }}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white font-semibold text-emerald-400 focus:outline-none focus:border-neutral-600"
                  />
                  <span className="text-[10px] text-neutral-500 block mt-1">napr. 50 € na dovolenku</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Ročný cieľ v € / rok
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="napr. 600"
                    value={formYearlyTarget}
                    onChange={e => setFormYearlyTarget(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white font-semibold text-lime-400 focus:outline-none focus:border-neutral-600"
                  />
                  <span className="text-[10px] text-neutral-500 block mt-1">12 mesiacov plán</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Poznámka alebo účel
                </label>
                <textarea
                  rows={2}
                  placeholder="napr. letná dovolenka pri mori, sporenie 50 € mesačne..."
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
                  {editingItem ? 'Uložiť zmeny' : 'Pridať cieľ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
