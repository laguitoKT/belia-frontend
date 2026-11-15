import {
  Brush,
  BroomSparkles,
  Can,
  EyeClosed,
  Scissors,
  Sparkles,
  Droplets
} from 'lucide-react';

const CATEGORY_THEMES = {
  cabello: {
    key: 'pink-scissors',
    bg: 'bg-[#FDECEF]',
    circle: 'bg-[#FADADD]/60',
    text: 'text-brand-primary',
    icon: Scissors,
  },
  coloración: {
    key: 'amber-droplets',
    bg: 'bg-[#FDF4E7]',
    circle: 'bg-[#F9E7CC]/60',
    text: 'text-[#9A6728]',
    icon: Droplets,
  },
  uñas: {
    key: 'mint-broom-sparkles',
    bg: 'bg-[#E9F7F5]',
    circle: 'bg-[#D1EFEA]/70',
    text: 'text-[#207268]',
    icon: BroomSparkles,
  },
  mirada: {
    key: 'blue-eye-closed',
    bg: 'bg-[#EEF3FC]',
    circle: 'bg-[#DCE7FA]/70',
    text: 'text-[#4169A1]',
    icon: EyeClosed,
  },
  maquillaje: {
    key: 'peach-brush',
    bg: 'bg-[#FFF0E8]',
    circle: 'bg-[#FADACA]/70',
    text: 'text-[#B7643C]',
    icon: Brush,
  },
  facial: {
    key: 'lavender-can',
    bg: 'bg-[#F3EEFC]',
    circle: 'bg-[#E4D8F7]/70',
    text: 'text-[#7650A5]',
    icon: Can,
  },
  'paquete mixto': {
    key: 'pink-sparkles',
    bg: 'bg-[#FDECEF]',
    circle: 'bg-[#FADADD]/60',
    text: 'text-[#C82344]',
    icon: Sparkles,
  },
};

const FALLBACK_THEME = CATEGORY_THEMES.cabello;

export const getCategoryTheme = (category = '') =>
  CATEGORY_THEMES[category.trim().toLowerCase()] || FALLBACK_THEME;

export const getThemeByKey = (key = '') =>
  Object.values(CATEGORY_THEMES).find((theme) => theme.key === key) ||
  FALLBACK_THEME;
