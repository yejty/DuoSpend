import React, { useState, useRef } from 'react';
import { 
  FileUp, 
  X, 
  Loader2, 
  Share2, 
  Lock, 
  FileText, 
  Sparkles,
  ArrowRight,
  Tag,
  AlertCircle
} from 'lucide-react';
import { AccountType, BankAccount, Category, OwnerId, PartnerProfile, Transaction } from '../types';
import { sampleStatementPresets } from '../data/sampleStatements';
import { formatCurrency } from '../utils/calculations';

interface PdfImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  partners: PartnerProfile[];
  accounts: BankAccount[];
  onImportSuccess: (
    account: Omit<BankAccount, 'id'> | { id: string }, 
    transactions: Omit<Transaction, 'id' | 'accountId'>[],
    targetAccountId?: string
  ) => void;
}

interface ParsedTransactionItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'expense' | 'income';
  category: Category;
  isShared: boolean;
  selected: boolean;
}

interface ParsedStatementPreview {
  bankName: string;
  accountNumberMasked: string;
  statementPeriod: string;
  currency: '€';
  ownerId: OwnerId;
  accountType: AccountType;
  fileName: string;
  transactions: ParsedTransactionItem[];
}

const AVAILABLE_CATEGORIES: Category[] = [
  'Potraviny a domácnosť',
  'Bývanie a nájom',
  'Energie a účty',
  'Reštaurácie a kaviarne',
  'Doprava a pohonné hmoty',
  'Nákupy a osobná radosť',
  'Zdravie a lekáreň',
  'Zábava a predplatné',
  'Cestovanie a dovolenka',
  'Deti a domáci miláčikovia',
  'Príjem a mzda',
  'Iné',
];

export const PdfImportModal: React.FC<PdfImportModalProps> = ({
  isOpen,
  onClose,
  partners,
  accounts,
  onImportSuccess,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<ParsedStatementPreview | null>(null);

  const [destinationMode, setDestinationMode] = useState<'new' | 'existing'>('new');
  const [targetExistingAccountId, setTargetExistingAccountId] = useState<string>(accounts[0]?.id || '');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const p1 = partners.find(p => p.id === 'partner1') || partners[0];
  const p2 = partners.find(p => p.id === 'partner2') || partners[1];

  if (!isOpen) return null;

  const processFile = async (file: File) => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = reader.result as string;
          resolve(res.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await fetch('/api/statements/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64: base64Data,
          mimeType: file.type || 'application/pdf',
          fileName: file.name,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Nepodarilo sa spracovať výpis.');
      }

      const d = result.data;
      setParsedPreview({
        bankName: d.bankName || 'Importovaný výpis',
        accountNumberMasked: d.accountNumberMasked || 'SK•• •••• ' + Math.floor(1000 + Math.random() * 9000),
        statementPeriod: d.statementPeriod || 'Nedávne obdobie',
        currency: '€',
        ownerId: d.detectedOwner === 'partner2' ? 'partner2' : d.detectedOwner === 'joint' ? 'joint' : 'partner1',
        accountType: d.suggestedAccountType === 'shared' ? 'shared' : 'private',
        fileName: file.name,
        transactions: (d.transactions || []).map((t: any, idx: number) => ({
          id: `item-${Date.now()}-${idx}`,
          date: t.date || new Date().toISOString().split('T')[0],
          description: t.description || 'Položka výpisu',
          amount: Math.abs(Number(t.amount) || 0),
          type: t.type === 'income' ? 'income' : 'expense',
          category: (t.category as Category) || 'Iné',
          isShared: Boolean(t.isShared),
          selected: true,
        })),
      });
    } catch (err: any) {
      console.warn('Backend parse notice, using sample preset template:', err);
      setErrorMsg(`Upozornenie spracovania: ${err.message}. Načítaná vzorka pre otestovanie.`);
      const sample = sampleStatementPresets[0];
      setParsedPreview({
        bankName: sample.bankName,
        accountNumberMasked: sample.accountNumberMasked,
        statementPeriod: sample.period,
        currency: '€',
        ownerId: sample.ownerId,
        accountType: sample.suggestedAccountType,
        fileName: file.name,
        transactions: sample.transactions.map((t, idx) => ({
          ...t,
          id: `sample-${idx}`,
          selected: true,
        })),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = (presetId: string) => {
    const preset = sampleStatementPresets.find(p => p.id === presetId);
    if (!preset) return;

    setErrorMsg(null);
    setParsedPreview({
      bankName: preset.bankName,
      accountNumberMasked: preset.accountNumberMasked,
      statementPeriod: preset.period,
      currency: '€',
      ownerId: preset.ownerId,
      accountType: preset.suggestedAccountType,
      fileName: preset.fileName,
      transactions: preset.transactions.map((t, idx) => ({
        ...t,
        id: `preset-${idx}`,
        selected: true,
      })),
    });
  };

  const handleBatchSetShared = (sharedState: boolean) => {
    if (!parsedPreview) return;
    setParsedPreview({
      ...parsedPreview,
      transactions: parsedPreview.transactions.map(t => ({
        ...t,
        isShared: sharedState,
      })),
    });
  };

  const handleConfirmImport = () => {
    if (!parsedPreview) return;

    const selectedTxs = parsedPreview.transactions
      .filter(t => t.selected)
      .map(t => ({
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: t.type,
        category: t.category,
        isShared: parsedPreview.accountType === 'shared' ? true : t.isShared,
        paidByOwnerId: parsedPreview.ownerId,
      }));

    if (destinationMode === 'existing' && targetExistingAccountId) {
      onImportSuccess({ id: targetExistingAccountId }, selectedTxs, targetExistingAccountId);
    } else {
      const balanceSum = selectedTxs.reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum - t.amount, 1200);
      onImportSuccess(
        {
          name: `${parsedPreview.bankName} (${parsedPreview.accountType === 'shared' ? 'Spoločný' : parsedPreview.ownerId === 'partner1' ? p1.name : p2.name})`,
          institution: parsedPreview.bankName,
          accountNumberMask: parsedPreview.accountNumberMasked,
          ownerId: parsedPreview.ownerId,
          accountType: parsedPreview.accountType,
          currency: '€',
          balance: Math.max(0, balanceSum),
          color: parsedPreview.ownerId === 'partner1' ? p1.avatarColor : parsedPreview.ownerId === 'partner2' ? p2.avatarColor : '#52525b',
          importedAt: new Date().toISOString().split('T')[0],
          statementFileName: parsedPreview.fileName,
        },
        selectedTxs
      );
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl my-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
              <FileUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100">
                Import bankového výpisu (PDF / CSV)
              </h3>
              <p className="text-xs text-zinc-400">
                Extrakcia transakcií v mene EUR (€) s možnosťou priradenia k účtu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!parsedPreview ? (
            <div className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    processFile(e.dataTransfer.files[0]);
                  }
                }}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition flex flex-col items-center justify-center ${
                  isDragging
                    ? 'border-zinc-400 bg-zinc-900/50'
                    : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 mb-2">
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-zinc-300" />
                  ) : (
                    <FileText className="w-5 h-5 text-zinc-300" />
                  )}
                </div>

                <div className="text-xs font-semibold text-zinc-200">
                  {loading ? 'AI spracováva bankový výpis...' : 'Presuňte sem PDF alebo CSV výpis banky'}
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 max-w-sm">
                  Podporované banky: Tatra banka, VÚB, ČSOB, Slovenská sporiteľňa, mBank, Revolut a štandardné výpisy.
                </p>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,application/pdf,.csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      processFile(e.target.files[0]);
                    }
                  }}
                />

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium text-xs transition disabled:opacity-50"
                >
                  Vybrať súbor z disku
                </button>
              </div>

              {/* Sample Presets */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="text-xs font-medium text-zinc-300 flex items-center gap-1.5 mb-2.5">
                  <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Alebo otestujte na ukážkových výpisoch slovenských bánk:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => handleLoadSample('sample-vub-alex')}
                    className="p-2.5 text-left rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition"
                  >
                    <div className="text-xs font-semibold text-zinc-200">VÚB Alex</div>
                    <div className="text-[11px] text-zinc-500">Súkromný • 5 txs</div>
                  </button>

                  <button
                    onClick={() => handleLoadSample('sample-csob-sam')}
                    className="p-2.5 text-left rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition"
                  >
                    <div className="text-xs font-semibold text-zinc-200">ČSOB Sam</div>
                    <div className="text-[11px] text-zinc-500">Súkromný • 4 txs</div>
                  </button>

                  <button
                    onClick={() => handleLoadSample('sample-tatra-joint')}
                    className="p-2.5 text-left rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition"
                  >
                    <div className="text-xs font-semibold text-zinc-200">Tatra Spoločný</div>
                    <div className="text-[11px] text-zinc-500">Spoločný pár • 4 txs</div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Review & Mapping */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-100">
                      {parsedPreview.bankName} ({parsedPreview.accountNumberMasked})
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      {parsedPreview.statementPeriod} • Mena: EUR (€)
                    </p>
                  </div>
                  <button
                    onClick={() => setParsedPreview(null)}
                    className="text-xs text-zinc-400 hover:text-zinc-200 underline"
                  >
                    Zmeniť súbor
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-zinc-400 mb-1">Cieľový účet:</label>
                    <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                      <button
                        type="button"
                        onClick={() => setDestinationMode('new')}
                        className={`py-1 px-2 rounded-lg font-medium border transition ${
                          destinationMode === 'new'
                            ? 'bg-zinc-800 text-zinc-100 border-zinc-700'
                            : 'bg-zinc-950 text-zinc-500 border-zinc-800'
                        }`}
                      >
                        + Nový účet
                      </button>
                      <button
                        type="button"
                        onClick={() => setDestinationMode('existing')}
                        className={`py-1 px-2 rounded-lg font-medium border transition ${
                          destinationMode === 'existing'
                            ? 'bg-zinc-800 text-zinc-100 border-zinc-700'
                            : 'bg-zinc-950 text-zinc-500 border-zinc-800'
                        }`}
                      >
                        Existujúci účet
                      </button>
                    </div>

                    {destinationMode === 'existing' ? (
                      <select
                        value={targetExistingAccountId}
                        onChange={(e) => setTargetExistingAccountId(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none"
                      >
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name} ({acc.accountNumberMask})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={parsedPreview.bankName}
                        onChange={(e) => setParsedPreview({ ...parsedPreview, bankName: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Vlastník a typ:</label>
                    <div className="space-y-1.5">
                      <select
                        value={parsedPreview.ownerId}
                        onChange={(e) => setParsedPreview({ ...parsedPreview, ownerId: e.target.value as OwnerId })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none"
                      >
                        <option value="partner1">{p1.name} (Partner 1)</option>
                        <option value="partner2">{p2.name} (Partner 2)</option>
                        <option value="joint">Spoločný pár</option>
                      </select>

                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setParsedPreview({ ...parsedPreview, accountType: 'shared' })}
                          className={`py-1 px-2 rounded-lg text-[11px] font-medium border flex items-center justify-center gap-1 transition ${
                            parsedPreview.accountType === 'shared'
                              ? 'bg-zinc-800 text-zinc-100 border-zinc-600'
                              : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                          }`}
                        >
                          <Share2 className="w-3 h-3" /> Spoločný
                        </button>
                        <button
                          type="button"
                          onClick={() => setParsedPreview({ ...parsedPreview, accountType: 'private' })}
                          className={`py-1 px-2 rounded-lg text-[11px] font-medium border flex items-center justify-center gap-1 transition ${
                            parsedPreview.accountType === 'private'
                              ? 'bg-zinc-800 text-zinc-100 border-zinc-600'
                              : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                          }`}
                        >
                          <Lock className="w-3 h-3" /> Súkromný
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transactions mapping list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-300">
                    Transakcie na import ({parsedPreview.transactions.filter(t => t.selected).length} vybraných):
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBatchSetShared(true)}
                      className="text-[11px] text-zinc-400 hover:text-zinc-200"
                    >
                      Všetky spoločné
                    </button>
                    <span className="text-zinc-600">•</span>
                    <button
                      onClick={() => handleBatchSetShared(false)}
                      className="text-[11px] text-zinc-400 hover:text-zinc-200"
                    >
                      Všetky súkromné
                    </button>
                  </div>
                </div>

                <div className="max-h-52 overflow-y-auto border border-zinc-800 rounded-xl divide-y divide-zinc-800 bg-zinc-950/70">
                  {parsedPreview.transactions.map((tx, idx) => (
                    <div key={tx.id} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={tx.selected}
                          onChange={(e) => {
                            const updated = [...parsedPreview.transactions];
                            updated[idx].selected = e.target.checked;
                            setParsedPreview({ ...parsedPreview, transactions: updated });
                          }}
                          className="rounded border-zinc-700 text-zinc-200 focus:ring-zinc-400"
                        />
                        <div className="min-w-0">
                          <div className="font-medium text-zinc-200 truncate">{tx.description}</div>
                          <div className="text-[10px] text-zinc-500 font-mono">{tx.date}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <select
                          value={tx.category}
                          onChange={(e) => {
                            const updated = [...parsedPreview.transactions];
                            updated[idx].category = e.target.value as Category;
                            setParsedPreview({ ...parsedPreview, transactions: updated });
                          }}
                          className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[11px] text-zinc-300 focus:outline-none"
                        >
                          {AVAILABLE_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...parsedPreview.transactions];
                            updated[idx].isShared = !updated[idx].isShared;
                            setParsedPreview({ ...parsedPreview, transactions: updated });
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                            tx.isShared
                              ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                              : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                          }`}
                        >
                          {tx.isShared ? 'Spoločné' : 'Súkromné'}
                        </button>

                        <span className="font-mono font-bold text-zinc-100 text-right w-16">
                          {formatCurrency(tx.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {parsedPreview && (
          <div className="p-4 border-t border-zinc-800 bg-zinc-900 flex items-center justify-between">
            <button
              onClick={() => setParsedPreview(null)}
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              Späť
            </button>
            <button
              onClick={handleConfirmImport}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-semibold text-xs transition"
            >
              <span>{destinationMode === 'existing' ? 'Pridať k existujúcemu účtu' : 'Vytvoriť a importovať účet'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
