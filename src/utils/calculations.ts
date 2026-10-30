import { BankAccount, Category, MonthlyIncomeRecord, PartnerProfile, Transaction } from '../types';

export interface JointContributionSummary {
  commonExpensesTotal: number;
  partner1Ratio: number;
  partner2Ratio: number;
  partner1FairShare: number; // Celkový podiel na spoločných výdavkoch
  partner2FairShare: number;
  partner1PaidOutOfPocket: number; // Koľko zaplatil zo svojho súkromného účtu na spoločné
  partner2PaidOutOfPocket: number;
  partner1TransferToJoint: number; // Koľko má poslať na spoločný účet
  partner2TransferToJoint: number;
  jointAccountDirectExpense: number; // Výdavky zaplatené priamo zo spoločného účtu
  summaryMessage: string;
}

export interface CoupleFinancialSummary {
  totalExpense: number;
  totalIncome: number;
  commonExpense: number;
  partner1TotalExpense: number;
  partner1PrivateExpense: number;
  partner1SharedContribution: number;
  partner2TotalExpense: number;
  partner2PrivateExpense: number;
  partner2SharedContribution: number;
  jointAccountExpense: number;
  currentMonthIncome: {
    partner1: number;
    partner2: number;
    total: number;
    partner1Ratio: number;
    partner2Ratio: number;
  };
  netMonthlySavings: number;
  contributions: JointContributionSummary;
  categoryTotals: Record<Category, {
    total: number;
    common: number;
    partner1: number;
    partner2: number;
  }>;
}

export function calculateCoupleFinances(
  transactions: Transaction[],
  accounts: BankAccount[],
  partners: PartnerProfile[],
  monthlyIncomes: MonthlyIncomeRecord[],
  selectedMonth?: string
): CoupleFinancialSummary {
  const p1 = partners.find((p) => p.id === 'partner1') || partners[0];
  const p2 = partners.find((p) => p.id === 'partner2') || partners[1];

  const activeMonth = selectedMonth || new Date().toISOString().slice(0, 7);
  const foundRecord = monthlyIncomes.find((r) => r.month === activeMonth) || monthlyIncomes[0];

  const p1Income = foundRecord ? foundRecord.partner1Income : p1.defaultMonthlyIncome;
  const p2Income = foundRecord ? foundRecord.partner2Income : p2.defaultMonthlyIncome;
  const totalIncomePool = Math.max(1, p1Income + p2Income);

  const p1IncomeRatio = p1Income / totalIncomePool;
  const p2IncomeRatio = p2Income / totalIncomePool;

  let totalExpense = 0;
  let totalIncome = 0;
  let commonExpense = 0;

  let p1Total = 0;
  let p1Private = 0;
  let p1Shared = 0;

  let p2Total = 0;
  let p2Private = 0;
  let p2Shared = 0;

  let jointExpense = 0;

  const categoryMap: Record<Category, { total: number; common: number; partner1: number; partner2: number }> = {
    'Potraviny a domácnosť': { total: 0, common: 0, partner1: 0, partner2: 0 },
    'Bývanie a nájom': { total: 0, common: 0, partner1: 0, partner2: 0 },
    'Energie a účty': { total: 0, common: 0, partner1: 0, partner2: 0 },
    'Reštaurácie a kaviarne': { total: 0, common: 0, partner1: 0, partner2: 0 },
    'Doprava a pohonné hmoty': { total: 0, common: 0, partner1: 0, partner2: 0 },
    'Nákupy a osobná radosť': { total: 0, common: 0, partner1: 0, partner2: 0 },
    'Zdravie a šport': { total: 0, common: 0, partner1: 0, partner2: 0 },
    'Zdravie a lekáreň': { total: 0, common: 0, partner1: 0, partner2: 0 },
    'Zábava a predplatné': { total: 0, common: 0, partner1: 0, partner2: 0 },
    'Cestovanie a dovolenka': { total: 0, common: 0, partner1: 0, partner2: 0 },
    'Deti a domáci miláčikovia': { total: 0, common: 0, partner1: 0, partner2: 0 },
    'Príjem a mzda': { total: 0, common: 0, partner1: 0, partner2: 0 },
    'Iné': { total: 0, common: 0, partner1: 0, partner2: 0 },
  };

  transactions.forEach((tx) => {
    if (tx.type === 'income') {
      totalIncome += tx.amount;
      return;
    }

    totalExpense += tx.amount;

    if (!categoryMap[tx.category]) {
      categoryMap[tx.category] = { total: 0, common: 0, partner1: 0, partner2: 0 };
    }
    categoryMap[tx.category].total += tx.amount;

    if (tx.isShared) {
      commonExpense += tx.amount;
      categoryMap[tx.category].common += tx.amount;
    }

    if (tx.paidByOwnerId === 'partner1') {
      p1Total += tx.amount;
      if (tx.isShared) {
        p1Shared += tx.amount;
      } else {
        p1Private += tx.amount;
        categoryMap[tx.category].partner1 += tx.amount;
      }
    } else if (tx.paidByOwnerId === 'partner2') {
      p2Total += tx.amount;
      if (tx.isShared) {
        p2Shared += tx.amount;
      } else {
        p2Private += tx.amount;
        categoryMap[tx.category].partner2 += tx.amount;
      }
    } else {
      jointExpense += tx.amount;
    }
  });

  // Výpočet príspevkov na spoločný účet podľa podielu príjmov
  const partner1FairShare = commonExpense * p1IncomeRatio;
  const partner2FairShare = commonExpense * p2IncomeRatio;

  // Ak partner zaplatil niečo zo súkromného účtu na spoločné, znižuje sa jeho prevod na spoločný účet
  const partner1TransferToJoint = Math.max(0, partner1FairShare - p1Shared);
  const partner2TransferToJoint = Math.max(0, partner2FairShare - p2Shared);

  const p1RatioPct = (p1IncomeRatio * 100).toFixed(1);
  const p2RatioPct = (p2IncomeRatio * 100).toFixed(1);

  const summaryMessage = `${p1.name} posiela ${formatCurrency(partner1TransferToJoint)} (${p1RatioPct} %) a ${p2.name} posiela ${formatCurrency(partner2TransferToJoint)} (${p2RatioPct} %) na spoločný účet.`;

  const netMonthlySavings = totalIncomePool - totalExpense;

  return {
    totalExpense,
    totalIncome,
    commonExpense,
    partner1TotalExpense: p1Total,
    partner1PrivateExpense: p1Private,
    partner1SharedContribution: p1Shared,
    partner2TotalExpense: p2Total,
    partner2PrivateExpense: p2Private,
    partner2SharedContribution: p2Shared,
    jointAccountExpense: jointExpense,
    currentMonthIncome: {
      partner1: p1Income,
      partner2: p2Income,
      total: p1Income + p2Income,
      partner1Ratio: p1IncomeRatio,
      partner2Ratio: p2IncomeRatio,
    },
    netMonthlySavings,
    contributions: {
      commonExpensesTotal: commonExpense,
      partner1Ratio: p1IncomeRatio,
      partner2Ratio: p2IncomeRatio,
      partner1FairShare,
      partner2FairShare,
      partner1PaidOutOfPocket: p1Shared,
      partner2PaidOutOfPocket: p2Shared,
      partner1TransferToJoint,
      partner2TransferToJoint,
      jointAccountDirectExpense: jointExpense,
      summaryMessage,
    },
    categoryTotals: categoryMap,
  };
}

export function formatCurrency(amount: number): string {
  const formatted = Math.abs(amount).toLocaleString('sk-SK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amount < 0 ? '-' : ''}${formatted} €`;
}
