/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BankAccount, MonthlyIncomeRecord, OwnerId, PartnerProfile, Transaction } from './types';
import { initialAccounts, initialMonthlyIncomes, initialPartners, initialTransactions } from './data/initialData';
import { Header } from './components/Header';
import { OverviewTab } from './components/OverviewTab';
import { AccountsTab } from './components/AccountsTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { TransactionsTab } from './components/TransactionsTab';
import { PdfImportModal } from './components/PdfImportModal';
import { ReceiptScanModal } from './components/ReceiptScanModal';
import { AddTransactionModal } from './components/AddTransactionModal';
import { MonthlyIncomeModal } from './components/MonthlyIncomeModal';
import { AdvisorChatDrawer } from './components/AdvisorChatDrawer';
import { CoupleSettingsModal } from './components/CoupleSettingsModal';

const STORAGE_KEY_ACCOUNTS = 'duospend_sk_accounts_v2';
const STORAGE_KEY_TXS = 'duospend_sk_transactions_v2';
const STORAGE_KEY_PARTNERS = 'duospend_sk_partners_v2';
const STORAGE_KEY_INCOMES = 'duospend_sk_incomes_v2';

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'analytics' | 'transactions'>('overview');

  // Modals
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Core Financial State
  const [partners, setPartners] = useState<PartnerProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PARTNERS);
      return saved ? JSON.parse(saved) : initialPartners;
    } catch {
      return initialPartners;
    }
  });

  const [accounts, setAccounts] = useState<BankAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
      return saved ? JSON.parse(saved) : initialAccounts;
    } catch {
      return initialAccounts;
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TXS);
      return saved ? JSON.parse(saved) : initialTransactions;
    } catch {
      return initialTransactions;
    }
  });

  const [monthlyIncomes, setMonthlyIncomes] = useState<MonthlyIncomeRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INCOMES);
      return saved ? JSON.parse(saved) : initialMonthlyIncomes;
    } catch {
      return initialMonthlyIncomes;
    }
  });

  // LocalStorage sync
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PARTNERS, JSON.stringify(partners));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [partners]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [accounts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TXS, JSON.stringify(transactions));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_INCOMES, JSON.stringify(monthlyIncomes));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [monthlyIncomes]);

  // Account Management
  const handleToggleAccountType = (accountId: string) => {
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === accountId) {
          const newType = acc.accountType === 'shared' ? 'private' : 'shared';
          return { ...acc, accountType: newType };
        }
        return acc;
      })
    );
  };

  const handleUpdateAccountOwner = (accountId: string, newOwnerId: OwnerId) => {
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === accountId) {
          return { ...acc, ownerId: newOwnerId };
        }
        return acc;
      })
    );
  };

  const handleDeleteAccount = (accountId: string) => {
    if (confirm('Naozaj chcete zmazať tento bankový účet a jeho položky?')) {
      setAccounts((prev) => prev.filter((a) => a.id !== accountId));
      setTransactions((prev) => prev.filter((t) => t.accountId !== accountId));
    }
  };

  const handleAddAccount = (newAccount: Omit<BankAccount, 'id'>) => {
    const id = 'acc-' + Date.now();
    setAccounts((prev) => [...prev, { ...newAccount, id }]);
  };

  // Import Statement Handler
  const handleImportSuccess = (
    accountData: Omit<BankAccount, 'id'> | { id: string },
    newTransactions: Omit<Transaction, 'id' | 'accountId'>[],
    targetAccountId?: string
  ) => {
    let finalAccountId = targetAccountId;

    if (!finalAccountId) {
      finalAccountId = 'acc-' + Date.now();
      const newAcc: BankAccount = {
        ...(accountData as Omit<BankAccount, 'id'>),
        id: finalAccountId,
      };
      setAccounts((prev) => [newAcc, ...prev]);
    }

    const builtTxs: Transaction[] = newTransactions.map((tx, idx) => ({
      ...tx,
      id: `tx-${Date.now()}-${idx}`,
      accountId: finalAccountId!,
    }));

    setTransactions((prev) => [...builtTxs, ...prev]);
    setActiveTab('overview');
  };

  // Transaction Management
  const handleToggleTransactionShared = (txId: string) => {
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id === txId) {
          return { ...tx, isShared: !tx.isShared };
        }
        return tx;
      })
    );
  };

  const handleDeleteTransaction = (txId: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== txId));
  };

  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const tx: Transaction = {
      ...newTx,
      id: 'tx-' + Date.now(),
    };
    setTransactions((prev) => [tx, ...prev]);
  };

  // Monthly Income Management
  const handleSaveMonthlyIncome = (record: Omit<MonthlyIncomeRecord, 'id' | 'dateRecorded'>) => {
    setMonthlyIncomes((prev) => {
      const existingIdx = prev.findIndex((r) => r.month === record.month);
      const newRec: MonthlyIncomeRecord = {
        ...record,
        id: existingIdx >= 0 ? prev[existingIdx].id : 'inc-' + Date.now(),
        dateRecorded: new Date().toISOString().split('T')[0],
      };

      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = newRec;
        return copy;
      }
      return [newRec, ...prev];
    });
  };

  const handleDeleteMonthlyIncome = (id: string) => {
    setMonthlyIncomes((prev) => prev.filter((r) => r.id !== id));
  };

  // Reset to default sample
  const handleResetSampleData = () => {
    if (confirm('Obnoviť počiatočné ukážkové slovenské dáta páru (Alex & Sam v €)?')) {
      setPartners(initialPartners);
      setAccounts(initialAccounts);
      setTransactions(initialTransactions);
      setMonthlyIncomes(initialMonthlyIncomes);
      localStorage.removeItem(STORAGE_KEY_ACCOUNTS);
      localStorage.removeItem(STORAGE_KEY_TXS);
      localStorage.removeItem(STORAGE_KEY_PARTNERS);
      localStorage.removeItem(STORAGE_KEY_INCOMES);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-zinc-700 selection:text-zinc-100">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        partners={partners}
        onOpenPdfModal={() => setIsPdfModalOpen(true)}
        onOpenReceiptModal={() => setIsReceiptModalOpen(true)}
        onOpenManualModal={() => setIsManualModalOpen(true)}
        onOpenIncomeModal={() => setIsIncomeModalOpen(true)}
        onOpenChatModal={() => setIsChatDrawerOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        accountsCount={accounts.length}
        transactionsCount={transactions.length}
      />

      {/* Main View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <OverviewTab
            transactions={transactions}
            accounts={accounts}
            partners={partners}
            monthlyIncomes={monthlyIncomes}
            onOpenPdfModal={() => setIsPdfModalOpen(true)}
            onOpenManualModal={() => setIsManualModalOpen(true)}
            onOpenIncomeModal={() => setIsIncomeModalOpen(true)}
            onSelectAccountTab={() => setActiveTab('accounts')}
            onSelectAnalyticsTab={() => setActiveTab('analytics')}
            onToggleShared={handleToggleTransactionShared}
          />
        )}

        {activeTab === 'accounts' && (
          <AccountsTab
            accounts={accounts}
            transactions={transactions}
            partners={partners}
            onToggleAccountType={handleToggleAccountType}
            onUpdateAccountOwner={handleUpdateAccountOwner}
            onDeleteAccount={handleDeleteAccount}
            onAddAccount={handleAddAccount}
            onOpenPdfModal={() => setIsPdfModalOpen(true)}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab
            transactions={transactions}
            accounts={accounts}
            partners={partners}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsTab
            transactions={transactions}
            accounts={accounts}
            partners={partners}
            onToggleShared={handleToggleTransactionShared}
            onDeleteTransaction={handleDeleteTransaction}
            onOpenManualModal={() => setIsManualModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-4 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            DuoSpend • Správa bankových výpisov a párových výdavkov v mene EUR (€)
          </span>
          <div className="flex items-center gap-4">
            <button
              onClick={handleResetSampleData}
              className="hover:text-zinc-300 transition underline underline-offset-2"
            >
              Obnoviť ukážkové dáta
            </button>
            <span>AI: Gemini 4 Argon & Gemini 3.8 Flash</span>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <PdfImportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        partners={partners}
        accounts={accounts}
        onImportSuccess={handleImportSuccess}
      />

      <ReceiptScanModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        partners={partners}
        accounts={accounts}
        onAddTransaction={handleAddTransaction}
      />

      <AddTransactionModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        accounts={accounts}
        partners={partners}
        onAddTransaction={handleAddTransaction}
      />

      <MonthlyIncomeModal
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
        partners={partners}
        monthlyIncomes={monthlyIncomes}
        onSaveMonthlyIncome={handleSaveMonthlyIncome}
        onDeleteMonthlyIncome={handleDeleteMonthlyIncome}
      />

      <AdvisorChatDrawer
        isOpen={isChatDrawerOpen}
        onClose={() => setIsChatDrawerOpen(false)}
        transactions={transactions}
        accounts={accounts}
        partners={partners}
        monthlyIncomes={monthlyIncomes}
      />

      <CoupleSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        partners={partners}
        onSavePartners={setPartners}
      />
    </div>
  );
}
