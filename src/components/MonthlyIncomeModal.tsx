import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Trash2, 
  TrendingUp
} from 'lucide-react';
import { MonthlyIncomeRecord, PartnerProfile } from '../types';
import { formatCurrency } from '../utils/calculations';

interface MonthlyIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  partners: PartnerProfile[];
  monthlyIncomes: MonthlyIncomeRecord[];
  onSaveMonthlyIncome: (record: Omit<MonthlyIncomeRecord, 'id' | 'dateRecorded'>) => void;
  onDeleteMonthlyIncome: (id: string) => void;
}

export const MonthlyIncomeModal: React.FC<MonthlyIncomeModalProps> = ({
  isOpen,
  onClose,
  partners,
  monthlyIncomes,
  onSaveMonthlyIncome,
  onDeleteMonthlyIncome,
}) => {
  const p1 = partners.find(p => p.id === 'partner1') || partners[0];
  const p2 = partners.find(p => p.id === 'partner2') || partners[1];

  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [p1Income, setP1Income] = useState(p1.defaultMonthlyIncome.toString());
  const [p2Income, setP2Income] = useState(p2.defaultMonthlyIncome.toString());
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const numP1 = parseFloat(p1Income) || 0;
  const numP2 = parseFloat(p2Income) || 0;
  const total = numP1 + numP2;
  const p1Ratio = total > 0 ? (numP1 / total) * 100 : 50;
  const p2Ratio = total > 0 ? (numP2 / total) * 100 : 50;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMonth || total <= 0) return;

    onSaveMonthlyIncome({
      month: selectedMonth,
      partner1Income: numP1,
      partner2Income: numP2,
      note: note.trim() || undefined,
    });

    setNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-xl shadow-2xl relative overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-semibold text-zinc-100">
              Mesačné príjmy a výpočet podielu
            </h3>
            <span className="text-xs text-zinc-500">• Mena EUR (€)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[75vh] text-xs">
          {/* Add / Edit Form */}
          <form onSubmit={handleSubmit} className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>Zadať mesačný príjem partnerov</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Mesiac
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-violet-300 mb-1 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-violet-400" />
                  <span>{p1.name} (€)</span>
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={p1Income}
                  onChange={(e) => setP1Income(e.target.value)}
                  className="w-full bg-zinc-900 border border-violet-500/40 rounded px-2.5 py-1.5 text-xs text-zinc-100 font-mono focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-amber-300 mb-1 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>{p2.name} (€)</span>
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={p2Income}
                  onChange={(e) => setP2Income(e.target.value)}
                  className="w-full bg-zinc-900 border border-amber-500/40 rounded px-2.5 py-1.5 text-xs text-zinc-100 font-mono focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Poznámka (voliteľná)
              </label>
              <input
                type="text"
                placeholder="napr. Mzda + odmeny"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none"
              />
            </div>

            {/* Calculated Ratio Preview */}
            <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="text-zinc-400">Spolu: </span>
                <span className="font-bold text-zinc-100 font-mono">{formatCurrency(total)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">Podiel na spoločné:</span>
                <span className="font-mono">
                  <span className="text-violet-400 font-semibold">{p1.name} {p1Ratio.toFixed(1)}%</span>
                  <span className="text-zinc-500 mx-1.5">/</span>
                  <span className="text-amber-400 font-semibold">{p2.name} {p2Ratio.toFixed(1)}%</span>
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition"
              >
                Uložiť príjem
              </button>
            </div>
          </form>

          {/* Historical Income Records */}
          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              História evidencie príjmov:
            </div>

            <div className="divide-y divide-zinc-800 rounded-lg border border-zinc-800 bg-zinc-950/60 overflow-hidden">
              {monthlyIncomes.length === 0 ? (
                <div className="p-3 text-center text-xs text-zinc-500">
                  Zatiaľ nie sú evidované žiadne mesačné príjmy.
                </div>
              ) : (
                monthlyIncomes.map((rec) => {
                  const recTotal = rec.partner1Income + rec.partner2Income;
                  const recP1Ratio = recTotal > 0 ? (rec.partner1Income / recTotal) * 100 : 50;
                  const recP2Ratio = recTotal > 0 ? (rec.partner2Income / recTotal) * 100 : 50;

                  return (
                    <div key={rec.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-semibold text-zinc-200 font-mono">
                          {rec.month}
                        </div>
                        {rec.note && (
                          <div className="text-[11px] text-zinc-400">{rec.note}</div>
                        )}
                        <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-2 font-mono">
                          <span className="text-violet-300">{p1.name}: {formatCurrency(rec.partner1Income)} ({recP1Ratio.toFixed(1)}%)</span>
                          <span>•</span>
                          <span className="text-amber-300">{p2.name}: {formatCurrency(rec.partner2Income)} ({recP2Ratio.toFixed(1)}%)</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="text-right">
                          <div className="font-bold text-zinc-100 font-mono">
                            {formatCurrency(recTotal)}
                          </div>
                          <span className="text-[10px] font-mono">
                            <span className="text-violet-400">{recP1Ratio.toFixed(0)}%</span> / <span className="text-amber-400">{recP2Ratio.toFixed(0)}%</span>
                          </span>
                        </div>

                        <button
                          onClick={() => onDeleteMonthlyIncome(rec.id)}
                          className="p-1 text-zinc-500 hover:text-rose-400 transition"
                          title="Zmazať"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded text-xs text-zinc-400 hover:text-zinc-200 transition"
          >
            Zatvoriť
          </button>
        </div>
      </div>
    </div>
  );
};
