import React, { useState } from 'react';
import { 
  ShieldCheck, 
  X, 
  Search, 
  Calendar, 
  Camera, 
  Download, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2, 
  Tag, 
  Clock, 
  FileText,
  Building2,
  Maximize2
} from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/calculations';
import { getOwnerConfig } from '../utils/themeColors';

interface WarrantyArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  onOpenReceiptScanModal: () => void;
}

export const WarrantyArchiveModal: React.FC<WarrantyArchiveModalProps> = ({
  isOpen,
  onClose,
  transactions,
  onOpenReceiptScanModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState<{ url: string; title: string; merchant: string; date: string; amount: number } | null>(null);

  if (!isOpen) return null;

  // Filter transactions that have warranty info
  const warrantyItems = transactions
    .filter(tx => tx.warranty && tx.warranty.isWarranty)
    .map(tx => {
      const w = tx.warranty!;
      const purchaseDate = new Date(w.purchaseDate || tx.date);
      const expiresDate = new Date(w.expiresAt);
      const now = new Date();
      
      const diffTime = expiresDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const isExpired = diffDays <= 0;

      return {
        tx,
        warranty: w,
        purchaseDate,
        expiresDate,
        diffDays,
        isExpired,
      };
    });

  const filteredItems = warrantyItems.filter(item => {
    if (statusFilter === 'active' && item.isExpired) return false;
    if (statusFilter === 'expired' && !item.isExpired) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchProduct = item.warranty.productName?.toLowerCase().includes(q);
      const matchMerchant = item.tx.description.toLowerCase().includes(q);
      const matchSerial = item.warranty.serialNumber?.toLowerCase().includes(q);
      if (!matchProduct && !matchMerchant && !matchSerial) return false;
    }

    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Archív účteniek a reklamácií</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-neutral-800 text-neutral-300 font-mono font-medium">
                  {warrantyItems.length} dokladov
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Odložené bločky a záručné lehoty pre prípadnú reklamáciu tovaru v predajni
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenReceiptScanModal();
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-xs flex items-center gap-1.5 transition active:scale-95"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Odfotiť nový doklad</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Search and Status Filter */}
        <div className="py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-neutral-800/80">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Hľadať tovar, obchod alebo sériové číslo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-600"
            />
          </div>

          <div className="flex items-center gap-1 p-0.5 bg-neutral-950 rounded-lg border border-neutral-800 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                statusFilter === 'all'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Všetky
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
                statusFilter === 'active'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>V záruke</span>
            </button>
            <button
              onClick={() => setStatusFilter('expired')}
              className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
                statusFilter === 'expired'
                  ? 'bg-neutral-800 text-neutral-200'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>Vypršané</span>
            </button>
          </div>
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {filteredItems.length === 0 ? (
            <div className="py-16 text-center">
              <ShieldCheck className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-white">Žiadne záručné účtenky</h4>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1 mb-4">
                Keď odfotíte bloček za elektroniku, obuv či spotrebič, označte ho ako tovar v záruke. Bloček sa vám sem uloží pre prípadnú reklamáciu.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenReceiptScanModal();
                }}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-xs inline-flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Odfotiť prvú účtenku pre záruku</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredItems.map(({ tx, warranty, diffDays, isExpired }) => {
                const ownerConf = getOwnerConfig(tx.paidByOwnerId);

                return (
                  <div
                    key={tx.id}
                    className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 hover:border-neutral-700 flex flex-col justify-between transition"
                  >
                    <div>
                      {/* Top status bar */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${ownerConf.badgeClass}`}>
                          {ownerConf.shortLabel}
                        </span>

                        {isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-neutral-900 text-neutral-400 border border-neutral-800">
                            <Clock className="w-3 h-3" />
                            <span>Záruka vypršala</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold font-mono">
                            <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                            <span>Zostáva {diffDays} dní</span>
                          </span>
                        )}
                      </div>

                      {/* Product Name & Merchant */}
                      <h4 className="text-sm font-bold text-white leading-tight">
                        {warranty.productName || tx.description}
                      </h4>
                      <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                        <span>{tx.description}</span>
                      </div>

                      {/* Meta data: Price, Dates, Serial Number */}
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-neutral-900 text-xs">
                        <div>
                          <span className="text-[10px] text-neutral-500 block">Kúpna cena</span>
                          <span className="font-mono font-bold text-white">
                            {formatCurrency(tx.amount)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-500 block">Dĺžka záruky</span>
                          <span className="font-mono text-neutral-300">
                            {warranty.warrantyMonths} mesiacov
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-500 block">Kúpené dňa</span>
                          <span className="font-mono text-neutral-400">
                            {warranty.purchaseDate || tx.date}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-500 block">Záruka platí do</span>
                          <span className={`font-mono font-medium ${isExpired ? 'text-neutral-500' : 'text-emerald-400'}`}>
                            {warranty.expiresAt}
                          </span>
                        </div>
                      </div>

                      {warranty.serialNumber && (
                        <div className="mt-2 text-[11px] text-neutral-400 bg-neutral-900 px-2 py-1 rounded border border-neutral-800/80 font-mono">
                          Sériové číslo: <strong className="text-neutral-200">{warranty.serialNumber}</strong>
                        </div>
                      )}
                    </div>

                    {/* Bottom photo action */}
                    <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                      {warranty.receiptImageUrl ? (
                        <button
                          onClick={() => setViewingPhotoUrl({
                            url: warranty.receiptImageUrl!,
                            title: warranty.productName || tx.description,
                            merchant: tx.description,
                            date: warranty.purchaseDate || tx.date,
                            amount: tx.amount,
                          })}
                          className="px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/30 text-xs font-medium flex items-center gap-1.5 transition active:scale-95"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>Otvoriť bloček pre reklamáciu</span>
                        </button>
                      ) : (
                        <div className="text-[11px] text-neutral-500 italic">
                          Účtenka zaevidovaná bez fotky
                        </div>
                      )}

                      <span className="text-[10px] text-neutral-500 font-mono">
                        ID: {tx.id}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Full-screen Photo Preview for Reclamation */}
      {viewingPhotoUrl && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <h4 className="text-sm font-bold text-white leading-tight">
                  {viewingPhotoUrl.title}
                </h4>
                <div className="text-xs text-neutral-400 mt-0.5">
                  {viewingPhotoUrl.merchant} • {viewingPhotoUrl.date} • {formatCurrency(viewingPhotoUrl.amount)}
                </div>
              </div>
              <button
                onClick={() => setViewingPhotoUrl(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto my-3 p-2 bg-neutral-950 rounded-xl border border-neutral-800/80 flex items-center justify-center">
              <img
                src={viewingPhotoUrl.url}
                alt={viewingPhotoUrl.title}
                className="max-h-[60vh] w-auto object-contain rounded shadow"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-neutral-400">
                Pripravené na ukázanie personálu v predajni
              </span>
              <a
                href={viewingPhotoUrl.url}
                download={`Zarucny_blocek_${viewingPhotoUrl.title.replace(/\s+/g, '_')}.png`}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-xs flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Stiahnuť originál</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
