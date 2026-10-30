import { Category, OwnerId, SavingsCategory } from '../types';

export const CATEGORY_COLORS: Record<Category, string> = {
  'Potraviny a domácnosť': '#10b981', // Emerald green
  'Bývanie a nájom': '#3b82f6', // Blue
  'Energie a účty': '#f59e0b', // Amber
  'Reštaurácie a kaviarne': '#f97316', // Orange
  'Doprava a pohonné hmoty': '#06b6d4', // Cyan
  'Nákupy a osobná radosť': '#ec4899', // Pink / Rose
  'Zdravie a šport': '#14b8a6', // Teal
  'Zdravie a lekáreň': '#2dd4bf', // Teal light
  'Zábava a predplatné': '#8b5cf6', // Violet
  'Cestovanie a dovolenka': '#6366f1', // Indigo
  'Deti a domáci miláčikovia': '#eab308', // Yellow
  'Príjem a mzda': '#22c55e', // Green
  'Iné': '#64748b', // Slate
};

export const SAVINGS_CATEGORY_COLORS: Record<SavingsCategory, { hex: string; bgClass: string; textClass: string; borderClass: string }> = {
  'Rezerva': {
    hex: '#0284c7', // Sky Blue
    bgClass: 'bg-sky-500/10',
    textClass: 'text-sky-400',
    borderClass: 'border-sky-500/30',
  },
  'Investície': {
    hex: '#8b5cf6', // Violet
    bgClass: 'bg-violet-500/10',
    textClass: 'text-violet-400',
    borderClass: 'border-violet-500/30',
  },
  'Dôchodok': {
    hex: '#f59e0b', // Amber
    bgClass: 'bg-amber-500/10',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/30',
  },
  'Ciele': {
    hex: '#10b981', // Emerald
    bgClass: 'bg-emerald-500/10',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/30',
  },
  'Iné': {
    hex: '#94a3b8', // Slate
    bgClass: 'bg-slate-500/10',
    textClass: 'text-slate-400',
    borderClass: 'border-slate-500/30',
  },
};

export const OWNER_COLORS = {
  joint: {
    name: 'Spoločný účet',
    shortLabel: 'Spoločný',
    hex: '#0284c7', // Sky Blue
    bgClass: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    badgeClass: 'bg-sky-950/80 text-sky-300 border-sky-700/60',
    accentText: 'text-sky-400',
    accentBorder: 'border-sky-500/50',
    avatarBg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  },
  partner1: {
    name: 'Daniel',
    shortLabel: 'Daniel',
    hex: '#8b5cf6', // Violet
    bgClass: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
    badgeClass: 'bg-violet-950/80 text-violet-300 border-violet-700/60',
    accentText: 'text-violet-400',
    accentBorder: 'border-violet-500/50',
    avatarBg: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
  },
  partner2: {
    name: 'Janka',
    shortLabel: 'Janka',
    hex: '#f59e0b', // Amber
    bgClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
    accentText: 'text-amber-400',
    accentBorder: 'border-amber-500/50',
    avatarBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
};

export function getCategoryColor(category: Category | string): string {
  return CATEGORY_COLORS[category as Category] || '#94a3b8';
}

export function getOwnerConfig(ownerId: OwnerId) {
  if (ownerId === 'partner2') return OWNER_COLORS.partner2;
  if (ownerId === 'partner1') return OWNER_COLORS.partner1;
  return OWNER_COLORS.joint;
}
