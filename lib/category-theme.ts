export interface CategoryTheme {
  badge: string;
  activeTab: string;
  activePill: string;
  borderHover: string;
  dotBg: string;
  cardTopBorder: string;
  bannerGradient: string;
  accentBg: string;
}

export function getCategoryTheme(color: string = 'sky'): CategoryTheme {
  switch (color) {
    case 'stone':
    case 'black':
    case 'dark':
      return {
        badge: 'bg-stone-900 text-stone-100 border-stone-800',
        activeTab: 'border-stone-900 text-white bg-stone-900 font-semibold shadow-xs',
        activePill: 'bg-stone-900 text-white border-stone-900 font-medium',
        borderHover: 'hover:border-stone-800 hover:bg-stone-100/50',
        dotBg: 'bg-stone-900',
        cardTopBorder: 'border-t-4 border-stone-900',
        bannerGradient: 'from-stone-900 via-stone-800 to-stone-950 text-white',
        accentBg: 'bg-stone-900 text-white',
      };
    case 'slate':
    case 'zinc':
    case 'gray':
      return {
        badge: 'bg-slate-100 text-slate-800 border-slate-300',
        activeTab: 'border-slate-700 text-slate-900 bg-slate-200 font-semibold shadow-xs',
        activePill: 'bg-slate-700 text-white border-slate-700 font-medium',
        borderHover: 'hover:border-slate-400 hover:bg-slate-100/60',
        dotBg: 'bg-slate-700',
        cardTopBorder: 'border-t-4 border-slate-600',
        bannerGradient: 'from-slate-800 via-slate-700 to-slate-900 text-white',
        accentBg: 'bg-slate-700 text-white',
      };
    case 'blue':
      return {
        badge: 'bg-blue-100 text-blue-900 border-blue-300 font-medium',
        activeTab: 'border-blue-700 text-blue-950 bg-blue-100 font-semibold shadow-xs',
        activePill: 'bg-blue-700 text-white border-blue-700 font-medium',
        borderHover: 'hover:border-blue-400 hover:bg-blue-50/60',
        dotBg: 'bg-blue-600',
        cardTopBorder: 'border-t-4 border-blue-600',
        bannerGradient: 'from-blue-900 via-blue-800 to-indigo-950 text-white',
        accentBg: 'bg-blue-700 text-white',
      };
    case 'red':
      return {
        badge: 'bg-red-100 text-red-900 border-red-300 font-medium',
        activeTab: 'border-red-700 text-red-950 bg-red-100 font-semibold shadow-xs',
        activePill: 'bg-red-700 text-white border-red-700 font-medium',
        borderHover: 'hover:border-red-400 hover:bg-red-50/60',
        dotBg: 'bg-red-600',
        cardTopBorder: 'border-t-4 border-red-600',
        bannerGradient: 'from-red-900 via-rose-800 to-red-950 text-white',
        accentBg: 'bg-red-700 text-white',
      };
    case 'violet':
    case 'purple':
      return {
        badge: 'bg-purple-100 text-purple-900 border-purple-300 font-medium',
        activeTab: 'border-purple-700 text-purple-950 bg-purple-100 font-semibold shadow-xs',
        activePill: 'bg-purple-700 text-white border-purple-700 font-medium',
        borderHover: 'hover:border-purple-400 hover:bg-purple-50/60',
        dotBg: 'bg-purple-600',
        cardTopBorder: 'border-t-4 border-purple-600',
        bannerGradient: 'from-purple-950 via-indigo-900 to-slate-950 text-white',
        accentBg: 'bg-purple-700 text-white',
      };
    case 'indigo':
      return {
        badge: 'bg-indigo-100 text-indigo-900 border-indigo-300 font-medium',
        activeTab: 'border-indigo-700 text-indigo-950 bg-indigo-100 font-semibold shadow-xs',
        activePill: 'bg-indigo-700 text-white border-indigo-700 font-medium',
        borderHover: 'hover:border-indigo-400 hover:bg-indigo-50/60',
        dotBg: 'bg-indigo-600',
        cardTopBorder: 'border-t-4 border-indigo-600',
        bannerGradient: 'from-indigo-900 via-indigo-800 to-slate-900 text-white',
        accentBg: 'bg-indigo-700 text-white',
      };
    case 'amber':
    case 'orange':
      return {
        badge: 'bg-amber-100 text-amber-950 border-amber-300 font-medium',
        activeTab: 'border-amber-600 text-amber-950 bg-amber-100 font-semibold shadow-xs',
        activePill: 'bg-amber-600 text-white border-amber-600 font-medium',
        borderHover: 'hover:border-amber-400 hover:bg-amber-50/60',
        dotBg: 'bg-amber-600',
        cardTopBorder: 'border-t-4 border-amber-500',
        bannerGradient: 'from-amber-800 via-orange-900 to-stone-900 text-white',
        accentBg: 'bg-amber-600 text-white',
      };
    case 'emerald':
    case 'green':
      return {
        badge: 'bg-emerald-100 text-emerald-950 border-emerald-300 font-medium',
        activeTab: 'border-emerald-700 text-emerald-950 bg-emerald-100 font-semibold shadow-xs',
        activePill: 'bg-emerald-700 text-white border-emerald-700 font-medium',
        borderHover: 'hover:border-emerald-400 hover:bg-emerald-50/60',
        dotBg: 'bg-emerald-600',
        cardTopBorder: 'border-t-4 border-emerald-500',
        bannerGradient: 'from-emerald-950 via-emerald-800 to-teal-950 text-white',
        accentBg: 'bg-emerald-700 text-white',
      };
    case 'rose':
    case 'pink':
      return {
        badge: 'bg-rose-100 text-rose-950 border-rose-300 font-medium',
        activeTab: 'border-rose-700 text-rose-950 bg-rose-100 font-semibold shadow-xs',
        activePill: 'bg-rose-700 text-white border-rose-700 font-medium',
        borderHover: 'hover:border-rose-400 hover:bg-rose-50/60',
        dotBg: 'bg-rose-600',
        cardTopBorder: 'border-t-4 border-rose-500',
        bannerGradient: 'from-rose-900 via-pink-900 to-stone-950 text-white',
        accentBg: 'bg-rose-700 text-white',
      };
    case 'teal':
    case 'cyan':
      return {
        badge: 'bg-teal-100 text-teal-950 border-teal-300 font-medium',
        activeTab: 'border-teal-700 text-teal-950 bg-teal-100 font-semibold shadow-xs',
        activePill: 'bg-teal-700 text-white border-teal-700 font-medium',
        borderHover: 'hover:border-teal-400 hover:bg-teal-50/60',
        dotBg: 'bg-teal-600',
        cardTopBorder: 'border-t-4 border-teal-500',
        bannerGradient: 'from-teal-950 via-cyan-900 to-slate-900 text-white',
        accentBg: 'bg-teal-700 text-white',
      };
    case 'sky':
    default:
      return {
        badge: 'bg-sky-100 text-sky-950 border-sky-300 font-medium',
        activeTab: 'border-sky-600 text-sky-950 bg-sky-100 font-semibold shadow-xs',
        activePill: 'bg-sky-600 text-white border-sky-600 font-medium',
        borderHover: 'hover:border-sky-400 hover:bg-sky-50/60',
        dotBg: 'bg-sky-500',
        cardTopBorder: 'border-t-4 border-sky-500',
        bannerGradient: 'from-sky-900 via-blue-900 to-slate-950 text-white',
        accentBg: 'bg-sky-600 text-white',
      };
  }
}

export const TOPIC_COLOR_OPTIONS = [
  { id: 'stone', label: 'Preto / Grafite', bg: 'bg-stone-900', ring: 'ring-stone-900' },
  { id: 'slate', label: 'Cinza Escuro', bg: 'bg-slate-700', ring: 'ring-slate-700' },
  { id: 'blue', label: 'Azul Forte', bg: 'bg-blue-700', ring: 'ring-blue-700' },
  { id: 'red', label: 'Vermelho', bg: 'bg-red-700', ring: 'ring-red-700' },
  { id: 'violet', label: 'Roxo / Violeta', bg: 'bg-purple-700', ring: 'ring-purple-700' },
  { id: 'indigo', label: 'Índigo / Azul Escuro', bg: 'bg-indigo-700', ring: 'ring-indigo-700' },
  { id: 'emerald', label: 'Verde Esmeralda', bg: 'bg-emerald-700', ring: 'ring-emerald-700' },
  { id: 'amber', label: 'Âmbar / Laranja', bg: 'bg-amber-600', ring: 'ring-amber-600' },
  { id: 'rose', label: 'Rosa / Magenta', bg: 'bg-rose-600', ring: 'ring-rose-600' },
  { id: 'teal', label: 'Verde Petróleo / Cyan', bg: 'bg-teal-700', ring: 'ring-teal-700' },
  { id: 'sky', label: 'Azul Céu', bg: 'bg-sky-500', ring: 'ring-sky-500' },
];
