import { type SpacingValuesNew } from '@trezor/theme';

import { type UISize } from '../../config/types';

export const bulletSizes = ['large', 'medium', 'small'] as const;
export type BulletSize = Extract<UISize, (typeof bulletSizes)[number]>;

export const bulletLineWidths = [0, 1, 2] as const;
export type BulletLineWidth = Extract<SpacingValuesNew, (typeof bulletLineWidths)[number]>;

export type BulletListItemState = 'default' | 'done' | 'active' | 'pending';

export const bulletListDirections = ['vertical', 'horizontal'] as const;
export type BulletListDirection = (typeof bulletListDirections)[number];
