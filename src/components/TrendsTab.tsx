import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Target, 
  PiggyBank, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Calendar, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles
} from 'lucide-react';
import { BankAccount, MonthlyIncomeRecord, PartnerProfile, SavingsItem, Transaction } from '../types';
import { formatCurrency } from '../utils/calculations';

interface TrendsTabProps {
  transactions: Transaction[];
  accounts: BankAccount[];
  partners: PartnerProfile[];
  monthlyIncomes?: MonthlyIncomeRecord[];
  savings?: SavingsItem[];
  onNavigateTab?: (tab: 'overview' | 'accounts' | 'analytics' | 'trends' | 'savings' | 'transactions') => void;
}

type SpendingScope = 'combined' | 'shared' | 'individual';

export const TrendsTab: React.FC<TrendsTabProps> = ({
  transactions,
  accounts,
  partners,
  monthlyIncomes,
  savings,
  onNavigateTab,
}) => {
  const [scope, setScope] = useState<SpendingScope>('combined');
  const [selectedIndividual, setSelectedIndividual] = useState<'both' | 'partner1' | 'partner2'>('both');
  const [timeframe, setTimeframe] = useState<6 | 12>(6);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('2026-10');

  const p1 = partners.find(p => p.id === 'partner1') || { name: 'Daniel' };
  const p2 = partners.find(p => p.id === 'partner2') || { name: 'Janka' };

  // Generate list of months for selected timeframe (6 or 12 months ending at 2026-11)
  const monthsList = useMemo(() => {
    const slovakShortMonths = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Máj', 'Jún', 'Júl', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
    const slovakFullMonths = ['', 'Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún', 'Júl', 'August', 'September', 'Október', 'November', 'December'];
    
    const endYear = 2026;
    const endMonth = 11; // November 2026
    const months = [];

    for (let i = timeframe - 1; i >= 0; i--) {
      let m = endMonth - i;
      let y = endYear;
      while (m < 1) {
        m += 12;
        y -= 1;
      }
      while (m > 12) {
        m -= 12;
        y += 1;
      }
      const key = `${y}-${String(m).padStart(2, '0')}`;
      months.push({
        key,
        shortLabel: `${slovakShortMonths[m]} ${String(y).slice(-2)}`,
        fullLabel: `${slovakFullMonths[m]} ${y}`,
        monthNum: m,
        year: y,
      });
    }
    return months;
  }, [timeframe]);

  // Active Income helper
  const getIncomeForMonth = (monthKey: string) => {
    const rec = monthlyIncomes?.find(inc => inc.month === monthKey);
    const defP1 = partners.find(p => p.id === 'partner1')?.defaultMonthlyIncome || 2400;
    const defP2 = partners.find(p => p.id === 'partner2')?.defaultMonthlyIncome || 1600;

    if (rec) {
      if (scope === 'individual') {
        if (selectedIndividual === 'partner1') return rec.partner1Income;
        if (selectedIndividual === 'partner2') return rec.partner2Income;
        return rec.partner1Income + rec.partner2Income;
      }
      return rec.partner1Income + rec.partner2Income;
    }

    if (scope === 'individual') {
      if (selectedIndividual === 'partner1') return defP1;
      if (selectedIndividual === 'partner2') return defP2;
      return defP1 + defP2;
    }
    return defP1 + defP2;
  };

  // Mesačný cieľ úspor (podľa zadaných položiek v Sporení)
  const monthlySavingsGoal = useMemo(() => {
    if (savings && savings.length > 0) {
      if (scope === 'individual') {
        const filteredSavings = savings.filter(s => {
          if (selectedIndividual === 'partner1') return s.ownerId === 'partner1';
          if (selectedIndividual === 'partner2') return s.ownerId === 'partner2';
          return s.ownerId === 'partner1' || s.ownerId === 'partner2';
        });
        const sum = filteredSavings.reduce((acc, s) => acc + (s.monthlyContribution || 0), 0);
        if (sum > 0) return sum;
      } else {
        const sum = savings.reduce((acc, s) => acc + (s.monthlyContribution || 0), 0);
        if (sum > 0) return sum;
      }
    }
    const currentIncome = getIncomeForMonth('2026-10');
    return Math.round(currentIncome * 0.25) || 800;
  }, [savings, scope, selectedIndividual, partners, monthlyIncomes]);

  // Agregované mesačné dáta za vybrané obdobie
  const trendData = useMemo(() => {
    return monthsList.map(m => {
      // Výdavky za daný mesiac so zohľadnením filtrov
      const monthTxs = transactions.filter(tx => {
        if (tx.type === 'income') return false;
        if (!tx.date.startsWith(m.key)) return false;
        if (selectedAccountId !== 'all' && tx.accountId !== selectedAccountId) return false;

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

      const totalSpend = monthTxs.reduce((sum, tx) => sum + tx.amount, 0);
      const income = getIncomeForMonth(m.key);
      const maxSpendingBudget = Math.max(0, income - monthlySavingsGoal);
      const netSavings = Math.max(0, income - totalSpend);
      const savingsRate = income > 0 ? (netSavings / income) * 100 : 0;
      const isGoalMet = totalSpend <= maxSpendingBudget;
      const savingsDelta = netSavings - monthlySavingsGoal;

      return {
        ...m,
        totalSpend,
        income,
        maxSpendingBudget,
        netSavings,
        savingsRate,
        isGoalMet,
        savingsDelta,
        txCount: monthTxs.length,
      };
    });
  }, [monthsList, transactions, selectedAccountId, scope, selectedIndividual, monthlyIncomes, partners, monthlySavingsGoal]);

  // Celkový súhrn trendu
  const trendSummary = useMemo(() => {
    const totalSpent = trendData.reduce((sum, d) => sum + d.totalSpend, 0);
    const totalIncome = trendData.reduce((sum, d) => sum + d.income, 0);
    const totalSaved = trendData.reduce((sum, d) => sum + d.netSavings, 0);
    const avgMonthlySpend = totalSpent / (trendData.length || 1);
    const avgMonthlySaved = totalSaved / (trendData.length || 1);
    const avgSavingsRate = totalIncome > 0 ? (totalSaved / totalIncome) * 100 : 0;
    const goalsMetCount = trendData.filter(d => d.isGoalMet).length;

    const latest = trendData[trendData.length - 1];
    const prev = trendData[trendData.length - 2];
    const momSpendDelta = prev && prev.totalSpend > 0 ? ((latest.totalSpend - prev.totalSpend) / prev.totalSpend) * 100 : 0;

    return {
      totalSpent,
      totalIncome,
      totalSaved,
      avgMonthlySpend,
      avgMonthlySaved,
      avgSavingsRate,
      goalsMetCount,
      momSpendDelta,
      latest,
    };
  }, [trendData]);

  // Geometria SVG grafu
  const svgWidth = 840;
  const svgHeight = 240;
  const padLeft = 70;
  const padRight = 40;
  const padTop = 32;
  const padBottom = 38;
  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const maxScaleVal = useMemo(() => {
    const highestVal = Math.max(
      ...trendData.map(d => Math.max(d.totalSpend, d.maxSpendingBudget, d.income * 0.7)),
      1000
    );
    return Math.ceil((highestVal * 1.15) / 500) * 500;
  }, [trendData]);

  const chartPoints = useMemo(() => {
    const n = trendData.length;
    const xStep = n > 1 ? chartW / (n - 1) : chartW;
    return trendData.map((d, i) => {
      const x = padLeft + i * xStep;
      const y = padTop + chartH - (d.totalSpend / maxScaleVal) * chartH;
      const budgetY = padTop + chartH - (d.maxSpendingBudget / maxScaleVal) * chartH;
      return {
        ...d,
        x,
        y,
        budgetY,
        index: i,
      };
    });
  }, [trendData, chartW, chartH, padLeft, padTop, maxScaleVal]);

  const { linePath, areaPath, budgetLinePath } = useMemo(() => {
    if (chartPoints.length === 0) return { linePath: '', areaPath: '', budgetLinePath: '' };

    let lPath = `M ${chartPoints[0].x} ${chartPoints[0].y}`;
    let bPath = `M ${chartPoints[0].x} ${chartPoints[0].budgetY}`;

    for (let i = 1; i < chartPoints.length; i++) {
      const prev = chartPoints[i - 1];
      const curr = chartPoints[i];
      const cp1x = prev.x + (curr.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = prev.x + (curr.x - prev.x) / 2;
      const cp2y = curr.y;
      lPath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
      bPath += ` L ${curr.x} ${curr.budgetY}`;
    }

    const firstPt = chartPoints[0];
    const lastPt = chartPoints[chartPoints.length - 1];
    const bottomY = padTop + chartH;
    const aPath = `${lPath} L ${lastPt.x} ${bottomY} L ${firstPt.x} ${bottomY} Z`;

    return { linePath: lPath, areaPath: aPath, budgetLinePath: bPath };
  }, [chartPoints, padTop, chartH]);

  const gridTicks = useMemo(() => {
    const ticksCount = 4;
    const step = maxScaleVal / ticksCount;
    const ticks = [];
    for (let i = 0; i <= ticksCount; i++) {
      const val = i * step;
      const y = padTop + chartH - (val / maxScaleVal) * chartH;
      ticks.push({ val, y });
    }
    return ticks;
  }, [maxScaleVal, padTop, chartH]);

  const selectedPoint = chartPoints.find(p => p.key === selectedMonthKey) || chartPoints[chartPoints.length - 1];

  return (
    <div className="space-y-6">
      {/* Top Header & Filters */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-sky-400" />
              Trendy výdavkov a plnenie cieľov
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Dlhodobý vývoj spotreby a úspor páru voči nastavenému cieľu ({formatCurrency(monthlySavingsGoal)} / mesiac)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Timeframe switcher */}
            <div className="flex items-center p-1 bg-neutral-950 rounded-lg border border-neutral-800 text-xs">
              <button
                onClick={() => setTimeframe(6)}
                className={`px-3 py-1.5 rounded-md font-medium transition ${
                  timeframe === 6
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                6 mesiacov
              </button>
              <button
                onClick={() => setTimeframe(12)}
                className={`px-3 py-1.5 rounded-md font-medium transition ${
                  timeframe === 12
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                12 mesiacov
              </button>
            </div>

            {/* Link to Savings goals */}
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('savings')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition active:scale-95"
                title="Prejsť do správy úspor a cieľov"
              >
                <PiggyBank className="w-3.5 h-3.5" />
                <span>Upraviť ciele</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter controls row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t border-neutral-800/80 text-xs">
          {/* Scope Selector */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">
              Rozsah výdavkov
            </label>
            <div className="flex items-center gap-1 p-0.5 bg-neutral-950 rounded-lg border border-neutral-800">
              <button
                onClick={() => setScope('combined')}
                className={`flex-1 py-1.5 px-2 rounded text-center text-xs transition ${
                  scope === 'combined'
                    ? 'bg-neutral-800 text-white font-medium'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Všetky
              </button>
              <button
                onClick={() => setScope('shared')}
                className={`flex-1 py-1.5 px-2 rounded text-center text-xs transition ${
                  scope === 'shared'
                    ? 'bg-neutral-800 text-white font-medium'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Spoločné
              </button>
              <button
                onClick={() => setScope('individual')}
                className={`flex-1 py-1.5 px-2 rounded text-center text-xs transition ${
                  scope === 'individual'
                    ? 'bg-neutral-800 text-white font-medium'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Súkromné
              </button>
            </div>
          </div>

          {/* Individual Owner filter (if individual) */}
          {scope === 'individual' ? (
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                Vybrať partnera
              </label>
              <div className="flex items-center gap-1.5 p-0.5 bg-neutral-950 rounded-lg border border-neutral-800">
                <button
                  onClick={() => setSelectedIndividual('both')}
                  className={`flex-1 py-1.5 px-2 rounded text-xs transition ${
                    selectedIndividual === 'both' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400'
                  }`}
                >
                  Obaja
                </button>
                <button
                  onClick={() => setSelectedIndividual('partner1')}
                  className={`flex-1 py-1.5 px-2 rounded text-xs transition ${
                    selectedIndividual === 'partner1' ? 'bg-violet-500/20 text-violet-300 font-semibold' : 'text-neutral-400'
                  }`}
                >
                  {p1.name}
                </button>
                <button
                  onClick={() => setSelectedIndividual('partner2')}
                  className={`flex-1 py-1.5 px-2 rounded text-xs transition ${
                    selectedIndividual === 'partner2' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-neutral-400'
                  }`}
                >
                  {p2.name}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                Cieľ mesačných úspor
              </label>
              <div className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 flex items-center justify-between font-mono">
                <span className="text-neutral-400">Nastavený vklad:</span>
                <span className="text-emerald-400 font-bold">{formatCurrency(monthlySavingsGoal)}</span>
              </div>
            </div>
          )}

          {/* Account Filter */}
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

      {/* 4 KPI Metriky za zvolené obdobie */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="text-xs text-neutral-400 font-medium flex items-center justify-between">
            <span>Priemerné výdavky</span>
            {trendSummary.momSpendDelta !== 0 && (
              <span className={`text-[10px] flex items-center font-mono ${
                trendSummary.momSpendDelta < 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {trendSummary.momSpendDelta < 0 ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                {Math.abs(trendSummary.momSpendDelta).toFixed(0)} %
              </span>
            )}
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono mt-1">
            {formatCurrency(trendSummary.avgMonthlySpend)}
          </div>
          <div className="text-[11px] text-neutral-500 font-mono mt-1">
            mesačný priemer ({timeframe} mesiacov)
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="text-xs text-neutral-400 font-medium flex items-center justify-between">
            <span>Priemerne ušetrené</span>
            <span className="text-[11px] text-emerald-400 font-mono font-bold">
              {trendSummary.avgSavingsRate.toFixed(0)} % príjmu
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono mt-1">
            {formatCurrency(trendSummary.avgMonthlySaved)}
          </div>
          <div className="text-[11px] text-neutral-500 font-mono mt-1">
            odložené mesačne do úspor
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="text-xs text-neutral-400 font-medium flex items-center justify-between">
            <span>Plnenie cieľa úspor</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
              {Math.round((trendSummary.goalsMetCount / (trendData.length || 1)) * 100)} %
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono mt-1">
            {trendSummary.goalsMetCount} / {trendData.length}
          </div>
          <div className="text-[11px] text-neutral-500 font-mono mt-1">
            mesiacov v limite rozpočtu
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="text-xs text-neutral-400 font-medium">Celkovo ušetrené ({timeframe}m)</div>
          <div className="text-xl sm:text-2xl font-bold text-sky-400 font-mono mt-1">
            {formatCurrency(trendSummary.totalSaved)}
          </div>
          <div className="text-[11px] text-neutral-500 font-mono mt-1 flex items-center gap-1">
            <span>Plán: {formatCurrency(monthlySavingsGoal * timeframe)}</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Chart Section */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-5 space-y-4">
        {/* Chart Header & Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-400" />
              Trajektória výdavkov voči limitu sporenia
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Kliknutím na bod grafu vyberiete konkrétny mesiac pre detailné zobrazenie nižšie
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-300">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 bg-sky-400 rounded-full inline-block" />
              <span>Skutočné výdavky</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-emerald-400 inline-block" />
              <span className="text-emerald-400">Limit pre splnenie cieľa úspor</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 pl-1 border-l border-neutral-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              <span>V limite</span>
              <span className="w-2 h-2 rounded-full bg-rose-400 inline-block ml-1" />
              <span>Prečerpaný</span>
            </div>
          </div>
        </div>

        {/* SVG Interactive Chart */}
        <div 
          className="relative w-full bg-neutral-950/70 rounded-xl border border-neutral-800/80 p-2 sm:p-4 overflow-hidden select-none"
          onMouseLeave={() => setHoveredTrendIndex(null)}
        >
          <div className="w-full overflow-x-auto">
            <div className="min-w-[660px]">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-auto block"
              >
                <defs>
                  <linearGradient id="trendsSpendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.32" />
                    <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.00" />
                  </linearGradient>
                </defs>

                {/* Horizontálne mriežkové čiary a škála Y */}
                {gridTicks.map((tick, i) => (
                  <g key={i}>
                    <line
                      x1={padLeft}
                      y1={tick.y}
                      x2={svgWidth - padRight}
                      y2={tick.y}
                      stroke="#262626"
                      strokeWidth={1}
                      strokeDasharray="2 3"
                    />
                    <text
                      x={padLeft - 10}
                      y={tick.y + 4}
                      fill="#737373"
                      fontSize={10}
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {formatCurrency(tick.val)}
                    </text>
                  </g>
                ))}

                {/* Limit výdavkov pre cieľ sporenia (Dashed Line) */}
                {budgetLinePath && (
                  <g>
                    <path
                      d={budgetLinePath}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth={1.8}
                      strokeDasharray="5 4"
                      className="opacity-80"
                    />
                    <text
                      x={svgWidth - padRight}
                      y={chartPoints[chartPoints.length - 1]?.budgetY - 7}
                      fill="#10b981"
                      fontSize={10}
                      fontFamily="monospace"
                      textAnchor="end"
                      fontWeight="bold"
                    >
                      Limit: {formatCurrency(chartPoints[chartPoints.length - 1]?.maxSpendingBudget || 0)}
                    </text>
                  </g>
                )}

                {/* Plocha výplne pod krivkou */}
                {areaPath && (
                  <path
                    d={areaPath}
                    fill="url(#trendsSpendGradient)"
                  />
                )}

                {/* Hlavná čiara výdavkov */}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth={2.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Vertikálne vodiace čiary a interaktívne body */}
                {chartPoints.map((pt, i) => {
                  const isHovered = hoveredTrendIndex === i;
                  const isSelected = selectedMonthKey === pt.key;

                  return (
                    <g 
                      key={pt.key} 
                      className="cursor-pointer" 
                      onClick={() => setSelectedMonthKey(pt.key)}
                    >
                      {/* Vertikálny stĺpec zvýraznenia */}
                      {(isHovered || isSelected) && (
                        <rect
                          x={pt.x - 22}
                          y={padTop}
                          width={44}
                          height={chartH}
                          fill={isSelected ? '#38bdf8' : '#ffffff'}
                          fillOpacity={isSelected ? 0.08 : 0.04}
                          rx={6}
                        />
                      )}

                      {/* Vertikálna čiara k bodu */}
                      {isHovered && (
                        <line
                          x1={pt.x}
                          y1={padTop}
                          x2={pt.x}
                          y2={padTop + chartH}
                          stroke="#737373"
                          strokeWidth={1}
                          strokeDasharray="3 3"
                        />
                      )}

                      {/* Zvýrazňovací vonkajší krúžok bodu */}
                      {(isHovered || isSelected) && (
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? 9 : 7}
                          fill={pt.isGoalMet ? '#10b981' : '#f43f5e'}
                          fillOpacity={0.25}
                        />
                      )}

                      {/* Samotný bod grafu */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 6 : isSelected ? 5.5 : 4.5}
                        fill={pt.isGoalMet ? '#10b981' : '#f43f5e'}
                        stroke="#0a0a0a"
                        strokeWidth={2.5}
                        className="transition-transform duration-150"
                      />

                      {/* Dotyková plocha pre ľahké klikanie a hoverovanie */}
                      <rect
                        x={pt.x - 28}
                        y={padTop}
                        width={56}
                        height={chartH + 30}
                        fill="transparent"
                        onMouseEnter={() => setHoveredTrendIndex(i)}
                      />

                      {/* Popis mesiaca na osi X */}
                      <text
                        x={pt.x}
                        y={padTop + chartH + 20}
                        fill={isSelected ? '#38bdf8' : isHovered ? '#ffffff' : '#a3a3a3'}
                        fontSize={11}
                        fontWeight={isSelected ? 'bold' : 'normal'}
                        textAnchor="middle"
                        fontFamily="sans-serif"
                      >
                        {pt.shortLabel}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Plávajúci interaktívny tooltip */}
          {hoveredTrendIndex !== null && chartPoints[hoveredTrendIndex] && (
            (() => {
              const pt = chartPoints[hoveredTrendIndex];
              const pctX = ((pt.x - padLeft) / chartW) * 100;
              const isRightSide = pctX > 60;

              return (
                <div
                  className={`absolute top-4 pointer-events-none z-20 bg-neutral-900 border border-neutral-700/90 rounded-xl p-3 shadow-2xl backdrop-blur-md transition-all duration-150 ${
                    isRightSide ? 'right-6' : 'left-6'
                  } max-w-xs text-xs`}
                >
                  <div className="flex items-center justify-between gap-3 border-b border-neutral-800 pb-2">
                    <span className="font-bold text-white text-sm">
                      {pt.fullLabel}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-neutral-800 text-neutral-300">
                      {pt.txCount} výdavkov
                    </span>
                  </div>

                  <div className="space-y-1.5 mt-2.5 font-mono">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-neutral-400">Výdavky:</span>
                      <span className="font-bold text-sky-400">{formatCurrency(pt.totalSpend)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-neutral-400">Príjem:</span>
                      <span className="text-neutral-200">{formatCurrency(pt.income)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-neutral-400">Ušetrené:</span>
                      <span className="font-semibold text-emerald-400">
                        {formatCurrency(pt.netSavings)} ({pt.savingsRate.toFixed(0)} %)
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 pt-1 border-t border-neutral-800">
                      <span className="text-neutral-400">Cieľ úspor:</span>
                      <span className="text-neutral-300">{formatCurrency(monthlySavingsGoal)}</span>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-neutral-800 flex items-center justify-between text-[11px]">
                    {pt.isGoalMet ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Cieľ splnený (+{formatCurrency(pt.savingsDelta)})</span>
                      </span>
                    ) : (
                      <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Prekročený o {formatCurrency(Math.abs(pt.savingsDelta))}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })()
          )}
        </div>
      </div>

      {/* Selected Month Detail Card & Breakdown Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Mesačný prehľad a porovnanie: {selectedPoint ? selectedPoint.fullLabel : selectedMonthKey}
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Prehľad plnenia rozpočtu a tvorby úspor za jednotlivé mesiace
            </p>
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('transactions')}
              className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 font-medium transition"
            >
              <span>Zobraziť transakcie v zozname</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Responsive Table of Monthly Trends */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-950/60 text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
              <tr>
                <th className="py-2.5 px-3">Mesiac</th>
                <th className="py-2.5 px-3 text-right">Mesačný príjem</th>
                <th className="py-2.5 px-3 text-right">Výdavky</th>
                <th className="py-2.5 px-3 text-right">Cieľ úspor</th>
                <th className="py-2.5 px-3 text-right">Skutočne ušetrené</th>
                <th className="py-2.5 px-3 text-right">Miera úspor</th>
                <th className="py-2.5 px-3 text-center">Stav rozpočtu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 font-mono">
              {trendData.slice().reverse().map(row => {
                const isSelected = row.key === selectedMonthKey;
                return (
                  <tr 
                    key={row.key}
                    onClick={() => setSelectedMonthKey(row.key)}
                    className={`cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-sky-500/10 hover:bg-sky-500/15' 
                        : 'hover:bg-neutral-800/40'
                    }`}
                  >
                    <td className="py-3 px-3 font-sans font-semibold text-white flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${row.isGoalMet ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      <span>{row.fullLabel}</span>
                      {isSelected && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-sans font-normal ml-1">
                          Vybraný
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right text-neutral-300">
                      {formatCurrency(row.income)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-sky-400">
                      {formatCurrency(row.totalSpend)}
                    </td>
                    <td className="py-3 px-3 text-right text-neutral-400">
                      {formatCurrency(monthlySavingsGoal)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-400">
                      {formatCurrency(row.netSavings)}
                    </td>
                    <td className="py-3 px-3 text-right text-neutral-200">
                      {row.savingsRate.toFixed(0)} %
                    </td>
                    <td className="py-3 px-3 text-center">
                      {row.isGoalMet ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>V pláne (+{formatCurrency(row.savingsDelta)})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          <AlertCircle className="w-3 h-3" />
                          <span>Prekročený ({formatCurrency(row.savingsDelta)})</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
