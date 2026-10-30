import { Category, Transaction } from '../types';

export interface SampleStatementPreset {
  id: string;
  name: string;
  fileName: string;
  bankName: string;
  accountNumberMasked: string;
  ownerId: 'partner1' | 'partner2' | 'joint';
  suggestedAccountType: 'shared' | 'private';
  currency: '€';
  period: string;
  transactions: Omit<Transaction, 'id' | 'accountId'>[];
}

export const sampleStatementPresets: SampleStatementPreset[] = [
  {
    id: 'sample-vub-alex',
    name: 'VÚB Bežný účet (Alex)',
    fileName: 'VUB_Vypis_Alex_November2026.pdf',
    bankName: 'VÚB banka',
    accountNumberMasked: 'SK88 •••• 3390',
    ownerId: 'partner1',
    suggestedAccountType: 'private',
    currency: '€',
    period: '01.11.2026 - 30.11.2026',
    transactions: [
      {
        date: '2026-11-04',
        description: 'Billa nákup pečivo a ovocie',
        amount: 32.40,
        type: 'expense',
        category: 'Potraviny a domácnosť',
        isShared: true,
        paidByOwnerId: 'partner1',
        note: 'Spoločná večera',
      },
      {
        date: '2026-11-07',
        description: 'Kaderníctvo / Barber Alex',
        amount: 25.00,
        type: 'expense',
        category: 'Nákupy a osobná radosť',
        isShared: false,
        paidByOwnerId: 'partner1',
      },
      {
        date: '2026-11-10',
        description: 'Reštaurácia Primi večera vo dvojici',
        amount: 58.20,
        type: 'expense',
        category: 'Reštaurácie a kaviarne',
        isShared: true,
        paidByOwnerId: 'partner1',
        note: 'Piatková večera',
      },
      {
        date: '2026-11-14',
        description: 'Apple One rodinné predplatné',
        amount: 14.95,
        type: 'expense',
        category: 'Zábava a predplatné',
        isShared: true,
        paidByOwnerId: 'partner1',
      },
      {
        date: '2026-11-18',
        description: 'Knihy Panta Rhei odborná literatúra',
        amount: 38.00,
        type: 'expense',
        category: 'Nákupy a osobná radosť',
        isShared: false,
        paidByOwnerId: 'partner1',
      },
    ],
  },
  {
    id: 'sample-csob-sam',
    name: 'ČSOB Smart účet (Sam)',
    fileName: 'CSOB_Vypis_Sam_November2026.pdf',
    bankName: 'ČSOB',
    accountNumberMasked: 'SK45 •••• 6019',
    ownerId: 'partner2',
    suggestedAccountType: 'private',
    currency: '€',
    period: '01.11.2026 - 30.11.2026',
    transactions: [
      {
        date: '2026-11-05',
        description: 'Tesco donáška potravín domov',
        amount: 68.90,
        type: 'expense',
        category: 'Potraviny a domácnosť',
        isShared: true,
        paidByOwnerId: 'partner2',
        note: 'Spoločné potraviny na týždeň',
      },
      {
        date: '2026-11-09',
        description: 'Masáž a wellness relax',
        amount: 45.00,
        type: 'expense',
        category: 'Zdravie a šport',
        isShared: false,
        paidByOwnerId: 'partner2',
      },
      {
        date: '2026-11-13',
        description: 'Jysk vankúše a deka do spálne',
        amount: 42.50,
        type: 'expense',
        category: 'Bývanie a nájom',
        isShared: true,
        paidByOwnerId: 'partner2',
        note: 'Spoločná spálňa',
      },
      {
        date: '2026-11-20',
        description: 'Kaviareň spoločné raňajky',
        amount: 22.40,
        type: 'expense',
        category: 'Reštaurácie a kaviarne',
        isShared: true,
        paidByOwnerId: 'partner2',
      },
    ],
  },
  {
    id: 'sample-tatra-joint',
    name: 'Tatra banka Spoločný domácnosť',
    fileName: 'TatraBanka_Spolocny_Nov2026.pdf',
    bankName: 'Tatra banka',
    accountNumberMasked: 'SK11 •••• 1128',
    ownerId: 'joint',
    suggestedAccountType: 'shared',
    currency: '€',
    period: '01.11.2026 - 30.11.2026',
    transactions: [
      {
        date: '2026-11-01',
        description: 'Nájomné a správa bytového domu',
        amount: 850.00,
        type: 'expense',
        category: 'Bývanie a nájom',
        isShared: true,
        paidByOwnerId: 'joint',
      },
      {
        date: '2026-11-04',
        description: 'SPP Plyn vykurovanie a voda',
        amount: 54.70,
        type: 'expense',
        category: 'Energie a účty',
        isShared: true,
        paidByOwnerId: 'joint',
      },
      {
        date: '2026-11-08',
        description: 'Metro veľký nákup zásob',
        amount: 145.80,
        type: 'expense',
        category: 'Potraviny a domácnosť',
        isShared: true,
        paidByOwnerId: 'joint',
      },
      {
        date: '2026-11-15',
        description: 'Veterinárna ambulancia očkovanie psíka',
        amount: 65.00,
        type: 'expense',
        category: 'Deti a domáci miláčikovia',
        isShared: true,
        paidByOwnerId: 'joint',
      },
    ],
  },
];
