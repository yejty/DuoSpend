import React, { useState } from 'react';
import { Settings, X, Users } from 'lucide-react';
import { PartnerProfile } from '../types';
import { formatCurrency } from '../utils/calculations';

interface CoupleSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  partners: PartnerProfile[];
  onSavePartners: (updated: PartnerProfile[]) => void;
}

export const CoupleSettingsModal: React.FC<CoupleSettingsModalProps> = ({
  isOpen,
  onClose,
  partners,
  onSavePartners,
}) => {
  const p1 = partners.find(p => p.id === 'partner1') || partners[0];
  const p2 = partners.find(p => p.id === 'partner2') || partners[1];

  const [name1, setName1] = useState(p1.name);
  const [income1, setIncome1] = useState(p1.defaultMonthlyIncome.toString());
  const [color1, setColor1] = useState(p1.avatarColor);

  const [name2, setName2] = useState(p2.name);
  const [income2, setIncome2] = useState(p2.defaultMonthlyIncome.toString());
  const [color2, setColor2] = useState(p2.avatarColor);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePartners([
      {
        id: 'partner1',
        name: name1.trim() || 'Partner 1',
        defaultMonthlyIncome: parseFloat(income1) || 0,
        avatarColor: color1,
      },
      {
        id: 'partner2',
        name: name2.trim() || 'Partner 2',
        defaultMonthlyIncome: parseFloat(income2) || 0,
        avatarColor: color2,
      },
    ]);
    onClose();
  };

  const totalIncome = (parseFloat(income1) || 0) + (parseFloat(income2) || 0);
  const p1Percent = totalIncome > 0 ? Math.round(((parseFloat(income1) || 0) / totalIncome) * 100) : 50;
  const p2Percent = 100 - p1Percent;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
              <Users className="w-4 h-4 text-zinc-300" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                Nastavenia profilov páru
              </h3>
              <p className="text-xs text-zinc-400">
                Mená a predvolené mesačné príjmy v eurách (€)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 space-y-3.5 text-xs">
          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-zinc-300">
              <span>Partner 1</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Meno</label>
                <input
                  type="text"
                  value={name1}
                  onChange={(e) => setName1(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-100 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Mesačný príjem (€)</label>
                <input
                  type="number"
                  value={income1}
                  onChange={(e) => setIncome1(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-100 font-mono focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-zinc-300">
              <span>Partner 2</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Meno</label>
                <input
                  type="text"
                  value={name2}
                  onChange={(e) => setName2(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-100 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Mesačný príjem (€)</label>
                <input
                  type="number"
                  value={income2}
                  onChange={(e) => setIncome2(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-100 font-mono focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-zinc-950 rounded border border-zinc-800 flex justify-between text-xs">
            <span className="text-zinc-400">Predvolený pomer:</span>
            <span className="font-semibold text-zinc-200 font-mono">
              {name1}: {p1Percent} % &nbsp;|&nbsp; {name2}: {p2Percent} %
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 text-xs text-zinc-400 hover:text-zinc-200"
            >
              Zrušiť
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-semibold text-xs transition"
            >
              Uložiť nastavenia
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
