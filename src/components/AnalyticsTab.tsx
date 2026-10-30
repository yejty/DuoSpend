import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  Share2, 
  Lock, 
  Calendar, 
  CreditCard
} from 'lucide-react';
import { BankAccount, Category, PartnerProfile, Transaction } from '../types';
import { calculateCoupleFinances, formatCurrency } from '../utils/calculations';

interface AnalyticsTabProps {
  transactions: Transaction[];
  accounts: BankAccount[];
  partners: PartnerProfile[];
}

type DateRangeType = 'all' | 'monthly' | 'yearly' | 'custom';
type SpendingScope = 'combined' | 'shared' | 'individual';
type ChartDisplayType = 'donut' | 'bars' | 'accounts';

// Elegant monochrome / neutral tones
const CATEGORY_COLORS: Record<string, string> = {
  'Bývanie a nájom': '#fafafa', // White
  'Potraviny a domácnosť': '#e4e4e7', // Zinc 200
  'Energie a účty': '#d4d4d8', // Zinc 300
  'Reštaurácie a kaviarne': '#a1a1aa', // Zinc 400
  'Doprava a pohonné hmoty': '#8e8e93', // Slate
  'Nákupy a osobná radosť': '#71717a', // Zinc 500
  'Zdravie a šport': '#64748b', // Slate 500
  'Zdravie a lekáreň': '#52525b', // Zinc 600
  'Zábava a predplatné': '#475569', // Slate 600
  'Deti a domáci miláčikovia': '#3f3f46', // Zinc 700
  'Cestovanie a dovolenka': '#334155', // Slate 700
  'Iné': '#27272a', // Zinc 800
};

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  transactions,
  accounts,
  partners,
}) => {
  const [scope, setScope] = useState<SpendingScope>('combined');
  const [selectedIndividual, setSelectedIndividual] = useState<'both' | 'partner1' | 'partner2'>('both');
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>('all');
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [customStartDate, setCustomStartDate] = useState('2026-10-01');
  const [customEndDate, setCustomEndDate] = useState('2026-11-30');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [chartDisplay, setChartDisplay] = useState<ChartDisplayType>('donut');
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);

  const p1 = partners.find(p => p.id === 'partner1') || partners[0];
  const p2 = partners.find(p => p.id === 'partner2') || partners[1];

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
    const sums: Partial<Record<Category, { amount: number; count: number }>> = {};
    filteredTxs.forEach((tx) => {
      if (!sums[tx.category]) {
        sums[tx.category] = { amount: 0, count: 0 };
      }
      sums[tx.category]!.amount += tx.amount;
      sums[tx.category]!.count += 1;
    });

    return Object.entries(sums)
      .map(([cat, data]) => ({
        category: cat as Category,
        amount: data!.amount,
        count: data!.count,
        percent: totalFilteredSpend > 0 ? Math.round((data!.amount / totalFilteredSpend) * 100) : 0,
        color: CATEGORY_COLORS[cat] || '#71717a',
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTxs, totalFilteredSpend]);

  const accountSpendingData = useMemo(() => {
    const sums: Record<string, number> = {};
    filteredTxs.forEach((tx) => {
      sums[tx.accountId] = (sums[tx.accountId] || 0) + tx.amount;
    });

    return accounts
      .map((acc) => ({
        account: acc,
        amount: sums[acc.id] || 0,
        percent: totalFilteredSpend > 0 ? Math.round(((sums[acc.id] || 0) / totalFilteredSpend) * 100) : 0,
      }))
      .filter((a) => a.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTxs, accounts, totalFilteredSpend]);

  const radius = 80;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;
  let cumulativeAngle = 0;

  const activeCategoryTxs = useMemo(() => {
    if (!activeCategory) return [];
    return filteredTxs.filter((tx) => tx.category === activeCategory);
  }, [activeCategory, filteredTxs]);

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-zinc-400" />
              Grafy výdavkov v mene EUR (€)
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Filtrovanie podľa kategórií, účtov a časového obdobia
            </p>
          </div>

          {/* Scope Selector: Všetky | Spoločné | Súkromné */}
          <div className="flex items-center gap-1 p-1 bg-zinc-950 rounded-lg border border-zinc-800 text-xs">
            <button
              onClick={() => { setScope('combined'); setActiveCategory(null); }}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                scope === 'combined'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Všetky výdavky
            </button>
            <button
              onClick={() => { setScope('shared'); setActiveCategory(null); }}
              className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1 transition ${
                scope === 'shared'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Share2 className="w-3 h-3" />
              Spoločné
            </button>
            <button
              onClick={() => { setScope('individual'); setActiveCategory(null); }}
              className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1 transition ${
                scope === 'individual'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Lock className="w-3 h-3" />
              Súkromné
            </button>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-zinc-800/80 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Časové obdobie
            </label>
            <select
              value={dateRangeType}
              onChange={(e) => setDateRangeType(e.target.value as DateRangeType)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none"
            >
              <option value="all">Všetky dátumy</option>
              <option value="monthly">Mesačný filter</option>
              <option value="yearly">Ročný filter</option>
              <option value="custom">Vlastný rozsah od-do</option>
            </select>
          </div>

          {dateRangeType === 'monthly' && (
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Vybrať mesiac
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none font-mono"
              >
                <option value="2026-10">Október 2026</option>
                <option value="2026-11">November 2026</option>
                <option value="2026-09">September 2026</option>
              </select>
            </div>
          )}

          {dateRangeType === 'yearly' && (
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Vybrať rok
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none font-mono"
              >
                <option value="2026">Rok 2026</option>
                <option value="2025">Rok 2025</option>
              </select>
            </div>
          )}

          {dateRangeType === 'custom' && (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">Od</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-200 focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">Do</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-200 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Filtrovať podľa účtu
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none"
            >
              <option value="all">Všetky účty</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.accountType === 'shared' ? 'Spoločný' : 'Súkromný'})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <div className="w-full flex items-center gap-1 p-1 bg-zinc-950 rounded-lg border border-zinc-800">
              <button
                onClick={() => setChartDisplay('donut')}
                className={`flex-1 py-1 px-2 rounded font-medium transition ${
                  chartDisplay === 'donut' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Prstenec
              </button>
              <button
                onClick={() => setChartDisplay('bars')}
                className={`flex-1 py-1 px-2 rounded font-medium transition ${
                  chartDisplay === 'bars' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Kategórie
              </button>
              <button
                onClick={() => setChartDisplay('accounts')}
                className={`flex-1 py-1 px-2 rounded font-medium transition ${
                  chartDisplay === 'accounts' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Účty
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column */}
        <div className="lg:col-span-6 bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  {scope === 'combined' && 'Všetky výdavky podľa kategórií'}
                  {scope === 'shared' && 'Spoločné výdavky domácnosti'}
                  {scope === 'individual' && 'Súkromné osobné výdavky'}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                  Suma: <strong className="text-zinc-100">{formatCurrency(totalFilteredSpend)}</strong> ({filteredTxs.length} položiek)
                </p>
              </div>
            </div>

            {/* Donut Chart */}
            {chartDisplay === 'donut' && (
              <div className="relative flex flex-col items-center justify-center my-6">
                <svg width="220" height="220" viewBox="0 0 240 240" className="transform -rotate-90">
                  <circle
                    cx="120"
                    cy="120"
                    r={radius}
                    fill="transparent"
                    stroke="#18181b"
                    strokeWidth={strokeWidth}
                  />
                  {categoryData.map((cat) => {
                    const strokeDasharray = `${(cat.amount / (totalFilteredSpend || 1)) * circumference} ${circumference}`;
                    const strokeDashoffset = -cumulativeAngle;
                    cumulativeAngle += (cat.amount / (totalFilteredSpend || 1)) * circumference;
                    const isSelected = activeCategory === cat.category;

                    return (
                      <circle
                        key={cat.category}
                        cx="120"
                        cy="120"
                        r={radius}
                        fill="transparent"
                        stroke={cat.color}
                        strokeWidth={isSelected ? strokeWidth + 4 : strokeWidth}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="cursor-pointer transition-all duration-200 hover:opacity-80"
                        onClick={() => setActiveCategory(isSelected ? null : cat.category)}
                      />
                    );
                  })}
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider max-w-[120px] truncate">
                    {activeCategory || 'Spolu'}
                  </span>
                  <span className="text-lg font-bold text-zinc-100 font-mono mt-0.5">
                    {activeCategory
                      ? formatCurrency(categoryData.find(c => c.category === activeCategory)?.amount || 0)
                      : formatCurrency(totalFilteredSpend)}
                  </span>
                  {activeCategory && (
                    <span className="text-[11px] text-zinc-300 font-mono">
                      {categoryData.find(c => c.category === activeCategory)?.percent} %
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Category Bars */}
            {chartDisplay === 'bars' && (
              <div className="space-y-2.5 my-4 max-h-[290px] overflow-y-auto pr-1">
                {categoryData.map((cat) => {
                  const isSelected = activeCategory === cat.category;
                  return (
                    <div
                      key={cat.category}
                      onClick={() => setActiveCategory(isSelected ? null : cat.category)}
                      className={`p-2 rounded-lg border transition cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-800 border-zinc-600'
                          : 'bg-zinc-950 border-zinc-800/80 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-200">{cat.category}</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-zinc-400 text-[11px]">{cat.percent} %</span>
                          <span className="font-bold text-zinc-100">{formatCurrency(cat.amount)}</span>
                        </div>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-1 mt-1.5 overflow-hidden">
                        <div
                          className="h-1 rounded-full"
                          style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Account Bars */}
            {chartDisplay === 'accounts' && (
              <div className="space-y-2.5 my-4 max-h-[290px] overflow-y-auto pr-1">
                {accountSpendingData.map((item) => (
                  <div
                    key={item.account.id}
                    className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-zinc-200">{item.account.name}</span>
                      <span className="font-mono font-bold text-zinc-100">
                        {formatCurrency(item.amount)} ({item.percent} %)
                      </span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden">
                      <div
                        className="h-1 rounded-full"
                        style={{ width: `${item.percent}%`, backgroundColor: item.account.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-[11px] text-zinc-500 pt-3 border-t border-zinc-800 flex items-center justify-between">
            <span>Kliknutím na segment filtrujete položky</span>
            {activeCategory && (
              <button
                onClick={() => setActiveCategory(null)}
                className="text-zinc-300 hover:underline"
              >
                Zrušiť výber
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Drilldown / Category List */}
        <div className="lg:col-span-6 bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                {activeCategory ? `Položky: ${activeCategory}` : 'Všetky kategórie'}
              </h3>
              <span className="text-xs text-zinc-500 font-mono">
                {activeCategory ? `${activeCategoryTxs.length} položiek` : `${categoryData.length} kategórií`}
              </span>
            </div>

            {activeCategory ? (
              <div className="mt-3 space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {activeCategoryTxs.length === 0 ? (
                  <div className="text-center py-6 text-zinc-500 text-xs">
                    V tejto kategórii nie sú žiadne položky.
                  </div>
                ) : (
                  activeCategoryTxs.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="text-zinc-200 font-medium">{tx.description}</div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          {tx.date} • {tx.isShared ? 'Spoločné' : 'Súkromné'}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-zinc-100">
                        {formatCurrency(tx.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[340px] overflow-y-auto pr-1">
                {categoryData.map((cat) => (
                  <div
                    key={cat.category}
                    onClick={() => setActiveCategory(cat.category)}
                    className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition cursor-pointer flex flex-col justify-between space-y-1.5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-xs font-medium text-zinc-200 line-clamp-1">
                          {cat.category}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-zinc-100">
                        {formatCurrency(cat.amount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                      <span>{cat.count} tx</span>
                      <span>{cat.percent} %</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
