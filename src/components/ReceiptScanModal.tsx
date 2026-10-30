import React, { useState, useRef } from 'react';
import { 
  Camera, 
  X, 
  Loader2, 
  Sparkles, 
  Share2, 
  Lock, 
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { BankAccount, Category, OwnerId, PartnerProfile, ReceiptAnalysisResult, Transaction } from '../types';
import { formatCurrency } from '../utils/calculations';

interface ReceiptScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  partners: PartnerProfile[];
  accounts: BankAccount[];
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
}

const SLOVAK_CATEGORIES: Category[] = [
  'Potraviny a domácnosť',
  'Bývanie a nájom',
  'Energie a účty',
  'Reštaurácie a kaviarne',
  'Doprava a pohonné hmoty',
  'Nákupy a osobná radosť',
  'Zdravie a šport',
  'Zdravie a lekáreň',
  'Zábava a predplatné',
  'Cestovanie a dovolenka',
  'Deti a domáci miláčikovia',
  'Iné',
];

export const ReceiptScanModal: React.FC<ReceiptScanModalProps> = ({
  isOpen,
  onClose,
  partners,
  accounts,
  onAddTransaction,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ReceiptAnalysisResult | null>(null);

  const [targetAccount, setTargetAccount] = useState<string>(accounts[0]?.id || '');
  const [targetOwner, setTargetOwner] = useState<OwnerId>('partner1');
  const [isShared, setIsShared] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<Category>('Potraviny a domácnosť');
  const [editableMerchant, setEditableMerchant] = useState('');
  const [editableAmount, setEditableAmount] = useState('');
  const [editableDate, setEditableDate] = useState(new Date().toISOString().split('T')[0]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const p1 = partners.find(p => p.id === 'partner1') || partners[0];
  const p2 = partners.find(p => p.id === 'partner2') || partners[1];

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setImagePreview(dataUrl);
        analyzeReceipt(dataUrl, file.type || 'image/jpeg');
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeReceipt = async (dataUrl: string, type: string) => {
    setLoading(true);
    setErrorMsg(null);
    setAnalysis(null);

    try {
      const base64Clean = dataUrl.split(',')[1];
      const response = await fetch('/api/receipts/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Clean,
          mimeType: type,
        }),
      });

      const res = await response.json();
      if (!response.ok || !res.success) {
        throw new Error(res.error || 'Nepodarilo sa spracovať účtenku.');
      }

      const d: ReceiptAnalysisResult = res.data;
      setAnalysis(d);
      setEditableMerchant(d.merchant || 'Nákup');
      setEditableAmount(d.totalAmount ? d.totalAmount.toString() : '0.00');
      setEditableDate(d.date || new Date().toISOString().split('T')[0]);
      setIsShared(Boolean(d.isSharedExpense));
      if (d.category) {
        setSelectedCategory(d.category);
      }
    } catch (err: any) {
      console.warn('Backend receipt analysis fallback:', err);
      const mockResult: ReceiptAnalysisResult = {
        merchant: 'Lidl Slovenská republika',
        date: new Date().toISOString().split('T')[0],
        totalAmount: 48.75,
        currency: '€',
        taxAmount: 8.12,
        category: 'Potraviny a domácnosť',
        suggestedAccountType: 'shared',
        isSharedExpense: true,
        splitRationale: 'Potraviny a suroviny do spoločnej domácnosti.',
        splitPerPerson: 24.38,
        summary: 'Nákup potravín a zeleniny.',
        items: [
          { name: 'Kvasový chlieb', quantity: 1, price: 2.19 },
          { name: 'Bio mlieko 1L', quantity: 2, price: 2.78 },
          { name: 'Slovenské maslo', quantity: 2, price: 4.98 },
          { name: 'Jablká Gala 1kg', quantity: 1, price: 1.89 },
          { name: 'Kuracie prsia', quantity: 1, price: 8.50 },
        ],
      };
      setAnalysis(mockResult);
      setEditableMerchant(mockResult.merchant);
      setEditableAmount(mockResult.totalAmount.toString());
      setEditableDate(mockResult.date);
      setIsShared(mockResult.isSharedExpense);
      setSelectedCategory(mockResult.category);
      setErrorMsg(`Upozornenie: ${err.message}. Načítaná ukážková účtenka pre test.`);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSampleReceipt = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#fafafa';
      ctx.fillRect(0, 0, 400, 480);
      ctx.fillStyle = '#18181b';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('LIDL SLOVENSKO v.o.s.', 200, 45);
      ctx.font = '13px monospace';
      ctx.fillText('Bratislava - Ružinov', 200, 70);
      ctx.fillText('Dátum: 2026-10-28', 200, 90);
      ctx.fillRect(35, 105, 330, 1.5);
      ctx.textAlign = 'left';
      ctx.fillText('Kvasový chlieb             2.19 €', 45, 140);
      ctx.fillText('Bio mlieko 2x              2.78 €', 45, 170);
      ctx.fillText('Slovenské maslo 2x         4.98 €', 45, 200);
      ctx.fillText('Jablká 1kg                 1.89 €', 45, 230);
      ctx.fillText('Kuracie prsia              8.50 €', 45, 260);
      ctx.fillRect(35, 290, 330, 1.5);
      ctx.font = 'bold 15px monospace';
      ctx.fillText('SPOLU CELKOM:             48.75 €', 45, 330);
      ctx.fillText('Z TOHO DPH 20%:            8.12 €', 45, 360);
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ĎAKUJEME ZA VÁŠ NÁKUP', 200, 420);
    }
    const sampleUrl = canvas.toDataURL('image/jpeg');
    setImagePreview(sampleUrl);
    analyzeReceipt(sampleUrl, 'image/jpeg');
  };

  const handleConfirmSave = () => {
    const amountNum = parseFloat(editableAmount) || 0;
    if (!editableMerchant.trim() || amountNum <= 0) return;

    onAddTransaction({
      accountId: targetAccount,
      date: editableDate,
      description: editableMerchant.trim(),
      amount: amountNum,
      type: 'expense',
      category: selectedCategory,
      isShared,
      paidByOwnerId: targetOwner,
      note: analysis ? `Účtenka: ${analysis.summary}` : 'Bloček',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-xl my-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-zinc-100">
              Skenovanie účtenky a bločku
            </h3>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono">
              gemini-4-argon
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3.5 text-xs">
          {errorMsg && (
            <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!imagePreview ? (
            <div className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950/60 rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center"
              >
                <div className="w-9 h-9 rounded bg-zinc-900 flex items-center justify-center text-zinc-400 mb-2">
                  <Camera className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold text-zinc-200">
                  Kliknite pre nahratie fotografie bločku
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Extrakcia sumy v € a zaradenie do rozpočtu pomocou Gemini 4 Argon.
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              <div className="text-center">
                <button
                  onClick={handleLoadSampleReceipt}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs transition"
                >
                  Otestovať na vzorovom bločku (€)
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-4 flex flex-col items-center">
                  <img
                    src={imagePreview}
                    alt="Bloček"
                    className="w-full max-h-36 object-cover rounded border border-zinc-800"
                  />
                  <button
                    onClick={() => { setImagePreview(null); setAnalysis(null); }}
                    className="text-[11px] text-zinc-500 hover:text-zinc-300 mt-1.5 underline"
                  >
                    Iná fotka
                  </button>
                </div>

                <div className="sm:col-span-8 flex flex-col justify-center">
                  {loading ? (
                    <div className="p-4 text-center space-y-1.5 bg-zinc-950 rounded-lg border border-zinc-800">
                      <Loader2 className="w-4 h-4 animate-spin text-zinc-400 mx-auto" />
                      <div className="text-xs text-zinc-300">
                        gemini-4-argon analyzuje bloček...
                      </div>
                    </div>
                  ) : analysis ? (
                    <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-200">
                          Odporúčanie zaradenia:
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300">
                          {isShared ? 'Spoločný nákup' : 'Súkromný nákup'}
                        </span>
                      </div>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        {analysis.splitRationale}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              {analysis && (
                <div className="space-y-2.5 pt-2 border-t border-zinc-800 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-zinc-400 mb-1">Obchodník</label>
                      <input
                        type="text"
                        value={editableMerchant}
                        onChange={(e) => setEditableMerchant(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-zinc-100 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 mb-1">Suma (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editableAmount}
                        onChange={(e) => setEditableAmount(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-zinc-100 font-mono font-bold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 mb-1">Dátum</label>
                      <input
                        type="date"
                        value={editableDate}
                        onChange={(e) => setEditableDate(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-zinc-100 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-zinc-400 mb-1">Kategória</label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value as Category)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-100 focus:outline-none"
                      >
                        {SLOVAK_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-zinc-400 mb-1">Kto platil</label>
                      <select
                        value={targetOwner}
                        onChange={(e) => setTargetOwner(e.target.value as OwnerId)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-100 focus:outline-none"
                      >
                        <option value="partner1">{p1.name} (Partner 1)</option>
                        <option value="partner2">{p2.name} (Partner 2)</option>
                        <option value="joint">Spoločný účet páru</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-zinc-400 mb-1">Zaradenie</label>
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          onClick={() => setIsShared(true)}
                          className={`py-1 px-1 rounded border text-[10px] font-medium transition ${
                            isShared ? 'bg-zinc-800 text-zinc-100 border-zinc-600' : 'bg-zinc-950 text-zinc-500 border-zinc-800'
                          }`}
                        >
                          Spoločné
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsShared(false)}
                          className={`py-1 px-1 rounded border text-[10px] font-medium transition ${
                            !isShared ? 'bg-zinc-800 text-zinc-100 border-zinc-600' : 'bg-zinc-950 text-zinc-500 border-zinc-800'
                          }`}
                        >
                          Súkromné
                        </button>
                      </div>
                    </div>
                  </div>

                  {analysis.items && analysis.items.length > 0 && (
                    <div className="p-2.5 bg-zinc-950 rounded border border-zinc-800 max-h-24 overflow-y-auto">
                      <div className="text-[10px] text-zinc-500 mb-1 uppercase tracking-wider font-mono">
                        Položky ({analysis.items.length}):
                      </div>
                      <div className="divide-y divide-zinc-900 text-[11px]">
                        {analysis.items.map((item, idx) => (
                          <div key={idx} className="py-0.5 flex justify-between text-zinc-300">
                            <span>{item.name}</span>
                            <span className="font-mono">{formatCurrency(item.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {analysis && (
          <div className="p-3 border-t border-zinc-800 bg-zinc-900 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1 text-xs text-zinc-400 hover:text-zinc-200"
            >
              Zrušiť
            </button>
            <button
              onClick={handleConfirmSave}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-semibold text-xs transition"
            >
              <span>Uložiť</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
