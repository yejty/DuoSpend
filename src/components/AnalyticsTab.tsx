import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Share2, 
  Lock, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  Tag,
  TrendingUp,
  TrendingDown,
  Target,
  PiggyBank,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight
} from 'lucide-react';
import { BankAccount, Category, MonthlyIncomeRecord, PartnerProfile, SavingsItem, Transaction } from '../types';
import { formatCurrency } from '../utils/calculations';
import { getCategoryColor, getOwnerConfig, OWNER_COLORS } from '../utils/themeColors';

interface AnalyticsTabProps {
  transactions: Transaction[];
  accounts: BankAccount[];
  partners: PartnerProfile[];
  monthlyIncomes?: MonthlyIncomeRecord[];
  savings?: SavingsItem[];
  onNavigateTab?: (tab: 'overview' | 'accounts' | 'analytics' | 'trends' | 'savings' | 'transactions') => void;
}

type DateRangeType = 'monthly' | 'yearly' | 'custom';
type SpendingScope = 'combined' | 'shared' | 'individual';

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  transactions,
  accounts,
  partners,
  monthlyIncomes,
  savings,
  onNavigateTab,
}) => {
  const [scope, setScope] = useState<SpendingScope>('combined');
  const [selectedIndividual, setSelectedIndividual] = useState<'both' | 'partner1' | 'partner2'>('both');
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>('monthly');
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [customStartDate, setCustomStartDate] = useState('2026-10-01');
  const [customEndDate, setCustomEndDate] = useState('2026-11-30');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  
  // Interactive expanded categories state (can expand multiple or toggle)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [hoveredCategory, setHoveredCategory] = useState<Category | null>(null);

  const p1 = partners.find(p => p.id === 'partner1') || { name: 'Daniel' };
  const p2 = partners.find(p => p.id === 'partner2') || { name: 'Janka' };

  const activeIncome = useMemo(() => {
    const rec = monthlyIncomes?.find(m => m.month === selectedMonth) || monthlyIncomes?.[0] || {
      month: '2026-10',
      partner1Income: 2500,
      partner2Income: 1700,
    };

    let monthlyBase = rec.partner1Income + rec.partner2Income;
    if (scope === 'individual') {
      if (selectedIndividual === 'partner1') {
        monthlyBase = rec.partner1Income;
      } else if (selectedIndividual === 'partner2') {
        monthlyBase = rec.partner2Income;
      }
    }

    if (dateRangeType === 'yearly') {
      return monthlyBase * 12;
    }
    return monthlyBase;
  }, [monthlyIncomes, selectedMonth, scope, selectedIndividual, dateRangeType]);

  const toggleCategoryExpand = (cat: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  const filteredTxs = useMemo(() => {
    return transactions.filter((tx) => {
      if (tx.type === 'income') return false;

      if (selectedAccountId !== 'all' && tx.accountId !== selectedAccountId) {
        return false;
      }

      if (dateRangeType === 'monthly') {
        if (!tx.date.startsWith(selectedMonth)) return false;
      } else if (dateRangeType === 'yearly') {
        if (!tx.date.startsWith(selectedYear)) return false;
      } else if (dateRangeType === 'custom') {
        if (customStartDate && tx.date < customStartDate) return false;
        if (customEndDate && tx.date > customEndDate) return false;
      }

      if (scope === 'shared') {
        return tx.isShared;
      } else if (scope === 'individual') {
        if (tx.isShared) return false;
        if (selectedIndividual === 'partner1') return tx.paidByOwnerId === 'partner1';
        if (selectedIndividual === 'partner2') return tx.paidByOwnerId === 'partner2';
        return true;
      }

      return true;
    });
  }, [
    transactions,
    selectedAccountId,
    dateRangeType,
    selectedMonth,
    selectedYear,
    customStartDate,
    customEndDate,
    scope,
    selectedIndividual,
  ]);

  const totalFilteredSpend = filteredTxs.reduce((sum, tx) => sum + tx.amount, 0);

  const categoryData = useMemo(() => {
    const sums: Partial<Record<Category, { amount: number; count: number; txs: Transaction[] }>> = {};
    filteredTxs.forEach((tx) => {
      if (!sums[tx.category]) {
        sums[tx.category] = { amount: 0, count: 0, txs: [] };
      }
      sums[tx.category]!.amount += tx.amount;
      sums[tx.category]!.count += 1;
      sums[tx.category]!.txs.push(tx);
    });

    return Object.entries(sums)
      .map(([cat, data]) => ({
        category: cat as Category,
        amount: data!.amount,
        count: data!.count,
        percent: totalFilteredSpend > 0 ? Math.round((data!.amount / totalFilteredSpend) * 100) : 0,
        color: getCategoryColor(cat),
        txs: data!.txs.sort((a, b) => b.date.localeCompare(a.date)),
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTxs, totalFilteredSpend]);

  // Donut geometry calculations
  const radius = 78;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;
  let cumulativeAngle = 0;

  return (
    <div className="space-y-6">
      {/* Filters Toolbar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              Grafy a štruktúra výdavkov
            </h2>
          </div>

          {/* Scope Selector: Všetky výdavky | Spoločné | Súkromné (Daniel / Janka) */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-neutral-950 rounded-lg border border-neutral-800 text-xs">
            <button
              onClick={() => setScope('combined')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                scope === 'combined'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Všetky výdavky
            </button>
            <button
              onClick={() => setScope('shared')}
              className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition ${
                scope === 'shared'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                  : 'text-neutral-400 hover:text-sky-300'
              }`}
            >
              <Share2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Spoločné</span>
            </button>
            <button
              onClick={() => setScope('individual')}
              className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition ${
                scope === 'individual'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Súkromné</span>
            </button>

            {scope === 'individual' && (
              <div className="flex items-center gap-1 pl-2 border-l border-neutral-800">
                <button
                  onClick={() => setSelectedIndividual('both')}
                  className={`px-2 py-0.5 rounded text-[11px] transition ${
                    selectedIndividual === 'both' ? 'bg-neutral-800 text-white font-semibold' : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Obaja
                </button>
                <button
                  onClick={() => setSelectedIndividual('partner1')}
                  className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 transition ${
                    selectedIndividual === 'partner1'
                      ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40 font-semibold'
                      : 'text-neutral-400 hover:text-violet-300'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                  <span>{p1.name}</span>
                </button>
                <button
                  onClick={() => setSelectedIndividual('partner2')}
                  className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 transition ${
                    selectedIndividual === 'partner2'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                      : 'text-neutral-400 hover:text-amber-300'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>{p2.name}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Date & Account Filters - WITHOUT 'Všetky dátumy' */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t border-neutral-800/80 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">
              Časové obdobie
            </label>
            <select
              value={dateRangeType}
              onChange={(e) => setDateRangeType(e.target.value as DateRangeType)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-neutral-600"
            >
              <option value="monthly">Mesačný filter</option>
              <option value="yearly">Ročný filter</option>
              <option value="custom">Vlastný rozsah od-do</option>
            </select>
          </div>

          {dateRangeType === 'monthly' && (
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                Vybrať mesiac
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-neutral-600 font-mono"
              >
                <option value="2026-10">Október 2026</option>
                <option value="2026-11">November 2026</option>
                <option value="2026-09">September 2026</option>
                <option value="2026-08">August 2026</option>
              </select>
            </div>
          )}

          {dateRangeType === 'yearly' && (
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                Vybrať rok
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-neutral-600 font-mono"
              >
                <option value="2026">Rok 2026</option>
                <option value="2025">Rok 2025</option>
              </select>
            </div>
          )}

          {dateRangeType === 'custom' && (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">Od</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-neutral-200 focus:outline-none focus:border-neutral-600"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">Do</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-neutral-200 focus:outline-none focus:border-neutral-600"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">
              Filtrovať podľa účtu
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-neutral-600"
            >
              <option value="all">Všetky účty</option>
              {accounts.map(acc => {
                const ownerTxt = acc.ownerId === 'partner1' ? p1.name : acc.ownerId === 'partner2' ? p2.name : 'Spoločný';
                return (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({ownerTxt})
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>
      {onNavigateTab && (
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-neutral-300">
            <TrendingUp className="w-4 h-4 text-sky-400" />
            <span>Chcete vidieť vývoj a plnenie cieľov za posledných 6 až 12 mesiacov?</span>
          </div>
          <button
            onClick={() => onNavigateTab('trends')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 font-medium transition text-xs whitespace-nowrap self-start sm:self-auto"
          >
            <span>Otvoriť kartu Trendy</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}



      {/* Main Unified View: Donut on Left, Expandable Categories on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Donut Chart & Overview (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-neutral-900 border border-neutral-800 rounded-xl p-5 sticky top-20">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                {scope === 'combined' && 'Všetky výdavky'}
                {scope === 'shared' && 'Spoločné výdavky'}
                {scope === 'individual' && 'Súkromné výdavky'}
              </h3>
            </div>
            <span className="text-xs font-mono font-semibold text-emerald-400">
              {filteredTxs.length} výdavkov
            </span>
          </div>

          {totalFilteredSpend === 0 ? (
            <div className="py-16 text-center text-neutral-500 text-xs">
              V zvolenom období sa nenašli žiadne výdavky.
            </div>
          ) : (
            <>
              {/* Interactive SVG Donut */}
              <div className="relative flex flex-col items-center justify-center my-6">
                <svg width="240" height="240" viewBox="0 0 240 240" className="transform -rotate-90">
                  <circle
                    cx="120"
                    cy="120"
                    r={radius}
                    fill="transparent"
                    stroke="#1c1917"
                    strokeWidth={strokeWidth}
                  />
                  {categoryData.map((cat) => {
                    const strokeDasharray = `${(cat.amount / (totalFilteredSpend || 1)) * circumference} ${circumference}`;
                    const strokeDashoffset = -cumulativeAngle;
                    cumulativeAngle += (cat.amount / (totalFilteredSpend || 1)) * circumference;
                    const isHovered = hoveredCategory === cat.category;
                    const isExpanded = !!expandedCategories[cat.category];

                    return (
                      <circle
                        key={cat.category}
                        cx="120"
                        cy="120"
                        r={radius}
                        fill="transparent"
                        stroke={cat.color}
                        strokeWidth={isHovered || isExpanded ? strokeWidth + 5 : strokeWidth}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="cursor-pointer transition-all duration-200 hover:opacity-85"
                        onMouseEnter={() => setHoveredCategory(cat.category)}
                        onMouseLeave={() => setHoveredCategory(null)}
                        onClick={() => toggleCategoryExpand(cat.category)}
                      />
                    );
                  })}
                </svg>

                {/* Donut Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
                  <span className="text-[11px] text-neutral-400 uppercase tracking-wider truncate max-w-[140px]">
                    {hoveredCategory || 'Spolu výdavky'}
                  </span>
                  <span className="text-xl font-bold text-white font-mono mt-0.5">
                    {hoveredCategory
                      ? formatCurrency(categoryData.find(c => c.category === hoveredCategory)?.amount || 0)
                      : formatCurrency(totalFilteredSpend)}
                  </span>
                  {hoveredCategory ? (
                    <span className="text-xs text-neutral-300 font-mono mt-0.5">
                      {categoryData.find(c => c.category === hoveredCategory)?.percent} % z výdavkov
                    </span>
                  ) : (
                    <span className="text-[11px] text-neutral-500 mt-0.5">
                      {categoryData.length} kategórií
                    </span>
                  )}
                </div>
              </div>

              {/* Podiel na mesačnom príjme bez duplicitného menovania kategórií */}
              <div className="pt-4 border-t border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400 font-medium">Podiel z mesačného príjmu</span>
                  <span className="font-mono text-neutral-300">
                    <span className="text-rose-400 font-semibold">
                      {activeIncome > 0 ? ((totalFilteredSpend / activeIncome) * 100).toFixed(1) : 0} %
                    </span>
                    <span className="text-neutral-600 mx-1">/</span>
                    {formatCurrency(activeIncome)}
                  </span>
                </div>

                {/* Kompaktný farebný prúžok kategórií */}
                <div className="w-full h-3 bg-neutral-950 rounded-full overflow-hidden flex border border-neutral-800/80 p-0.5">
                  {categoryData.map(cat => {
                    const catIncomeRatio = activeIncome > 0 ? (cat.amount / activeIncome) * 100 : 0;
                    if (catIncomeRatio <= 0) return null;
                    return (
                      <div
                        key={cat.category}
                        className="h-full rounded-xs transition-all duration-300 hover:brightness-125 cursor-pointer"
                        style={{
                          width: `${catIncomeRatio}%`,
                          backgroundColor: cat.color,
                        }}
                        title={`${cat.category}: ${formatCurrency(cat.amount)} (${catIncomeRatio.toFixed(1)} % z príjmu)`}
                        onClick={() => toggleCategoryExpand(cat.category)}
                      />
                    );
                  })}
                  {activeIncome > totalFilteredSpend && (
                    <div
                      className="h-full bg-emerald-500/25 border-l border-emerald-500/40 rounded-xs transition-all duration-300"
                      style={{ width: `${Math.max(0, 100 - (totalFilteredSpend / (activeIncome || 1)) * 100)}%` }}
                      title={`Zostáva z príjmu: ${formatCurrency(Math.max(0, activeIncome - totalFilteredSpend))}`}
                    />
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 pt-0.5">
                  <span>Výdavky: <strong className="text-neutral-200">{formatCurrency(totalFilteredSpend)}</strong></span>
                  <span>Zostáva: <strong className="text-emerald-400">{formatCurrency(Math.max(0, activeIncome - totalFilteredSpend))}</strong></span>
                </div>
              </div>

              {/* Quick Helper */}
              {Object.values(expandedCategories).some(Boolean) && (
                <div className="text-[11px] text-neutral-500 pt-2 border-t border-neutral-800 flex justify-end">
                  <button
                    onClick={() => setExpandedCategories({})}
                    className="text-neutral-400 hover:text-white transition-colors"
                  >
                    Zbaliť všetky položky
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: Expandable Categories by Default with Inline Transactions (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
              Kategórie a transakcie
            </h3>
            <button
              onClick={() => {
                const allExpanded = categoryData.every(c => expandedCategories[c.category]);
                const nextState: Record<string, boolean> = {};
                categoryData.forEach(c => {
                  nextState[c.category] = !allExpanded;
                });
                setExpandedCategories(nextState);
              }}
              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
            >
              {categoryData.every(c => expandedCategories[c.category]) ? 'Zbaliť všetky' : 'Rozbaliť všetky'}
            </button>
          </div>

          {categoryData.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 text-xs">
              Žiadne výdavky na zobrazenie.
            </div>
          ) : (
            <div className="space-y-2.5">
              {categoryData.map(cat => {
                const isExpanded = !!expandedCategories[cat.category];
                const isHovered = hoveredCategory === cat.category;

                return (
                  <div
                    key={cat.category}
                    className={`rounded-xl border transition-all overflow-hidden ${
                      isExpanded
                        ? 'bg-neutral-950 border-neutral-700 shadow-sm'
                        : isHovered
                        ? 'bg-neutral-950/70 border-neutral-700'
                        : 'bg-neutral-950/40 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    {/* Category Header Row (Click to Expand) */}
                    <div
                      onClick={() => toggleCategoryExpand(cat.category)}
                      onMouseEnter={() => setHoveredCategory(cat.category)}
                      onMouseLeave={() => setHoveredCategory(null)}
                      className="p-3.5 flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white truncate">
                              {cat.category}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-mono">
                              {cat.count} tx
                            </span>
                          </div>
                          {/* Percentage progress indicator */}
                          <div className="w-32 sm:w-48 bg-neutral-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-bold text-white font-mono">
                            {formatCurrency(cat.amount)}
                          </div>
                          <div className="text-xs text-neutral-400 font-mono">
                            {cat.percent} %
                          </div>
                        </div>
                        <div className="p-1 rounded text-neutral-400 hover:text-white">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Inline Expanded Transactions List */}
                    {isExpanded && (
                      <div className="border-t border-neutral-800/80 bg-neutral-900/40 p-3 space-y-2">
                        <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider px-1 pb-1 flex items-center justify-between">
                          <span>Zoznam položiek ({cat.txs.length})</span>
                          <span>Suma: {formatCurrency(cat.amount)}</span>
                        </div>

                        {cat.txs.map(tx => {
                          const ownerConf = getOwnerConfig(tx.paidByOwnerId);
                          const ownerName =
                            tx.paidByOwnerId === 'partner1'
                              ? p1.name
                              : tx.paidByOwnerId === 'partner2'
                              ? p2.name
                              : 'Spoločný účet';

                          return (
                            <div
                              key={tx.id}
                              className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800/80 flex items-center justify-between text-xs hover:border-neutral-700 transition-colors"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="text-neutral-200 font-medium truncate">
                                  {tx.description}
                                </div>
                                <div className="text-[11px] text-neutral-400 font-mono mt-0.5 flex flex-wrap items-center gap-1.5">
                                  <span>{tx.date}</span>
                                  <span>•</span>
                                  <span className={tx.isShared ? 'text-sky-400' : 'text-neutral-400'}>
                                    {tx.isShared ? 'Spoločné' : 'Súkromné'}
                                  </span>
                                  <span>•</span>
                                  <span className={`px-1.5 py-0.2 rounded text-[10px] border ${ownerConf.badgeClass}`}>
                                    {ownerName}
                                  </span>
                                  {tx.note && (
                                    <>
                                      <span>•</span>
                                      <span className="italic text-neutral-500 truncate max-w-[150px]">
                                        {tx.note}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="text-right flex-shrink-0">
                                <span className="font-mono font-bold text-white text-xs">
                                  {formatCurrency(tx.amount)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
