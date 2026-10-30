export type OwnerId = 'partner1' | 'partner2' | 'joint';

export interface PartnerProfile {
  id: OwnerId;
  name: string;
  avatarColor: string;
  defaultMonthlyIncome: number; // Predvolený mesačný príjem v €
}

export type AccountType = 'shared' | 'private'; // 'shared' = spoločný pár, 'private' = súkromný osobný

export interface BankAccount {
  id: string;
  name: string;
  institution: string;
  accountNumberMask: string;
  ownerId: OwnerId;
  accountType: AccountType;
  currency: '€';
  balance: number;
  color: string;
  importedAt?: string;
  statementFileName?: string;
}

export type Category =
  | 'Potraviny a domácnosť'
  | 'Bývanie a nájom'
  | 'Energie a účty'
  | 'Reštaurácie a kaviarne'
  | 'Doprava a pohonné hmoty'
  | 'Nákupy a osobná radosť'
  | 'Zdravie a šport'
  | 'Zdravie a lekáreň'
  | 'Zábava a predplatné'
  | 'Cestovanie a dovolenka'
  | 'Deti a domáci miláčikovia'
  | 'Príjem a mzda'
  | 'Iné';

export interface Transaction {
  id: string;
  accountId: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // v €
  type: 'expense' | 'income'; // výdavok alebo príjem
  category: Category;
  isShared: boolean; // spoločný výdavok pre pár alebo súkromný
  paidByOwnerId: OwnerId;
  note?: string;
}

export interface MonthlyIncomeRecord {
  id: string;
  month: string; // YYYY-MM (napr. "2026-10")
  partner1Income: number; // v €
  partner2Income: number; // v €
  dateRecorded: string;
  note?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

export interface ReceiptItem {
  name: string;
  quantity?: number;
  price: number;
}

export interface ReceiptAnalysisResult {
  merchant: string;
  date: string;
  totalAmount: number;
  currency: '€';
  taxAmount?: number;
  category: Category;
  suggestedAccountType: AccountType;
  isSharedExpense: boolean;
  splitRationale: string;
  splitPerPerson?: number;
  summary: string;
  items?: ReceiptItem[];
}

export type SavingsCategory = 'Rezerva' | 'Investície' | 'Dôchodok' | 'Ciele' | 'Iné';

export interface SavingsItem {
  id: string;
  name: string;
  category: SavingsCategory;
  currentAmount: number;
  targetAmount?: number;
  monthlyContribution?: number;
  ownerId: OwnerId;
  institutionOrAccount?: string;
  note?: string;
  lastUpdated: string;
}

