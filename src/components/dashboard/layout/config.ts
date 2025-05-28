import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';

export const navItems = [
  { key: 'overview', title: 'Solver', href: paths.dashboard.overview, icon: 'chart-pie' },
] satisfies NavItemConfig[];
