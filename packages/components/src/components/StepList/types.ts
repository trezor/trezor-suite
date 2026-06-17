import { type SpacingValuesNew } from '@trezor/theme';

import { type UISize } from '../../config/types';

export const bulletSizes = ['large', 'medium', 'small'] as const;
export type BulletSize = Extract<UISize, (typeof bulletSizes)[number]>;

export const stepLineWidths = [0, 1, 2] as const;
export type StepLineWidth = Extract<SpacingValuesNew, (typeof stepLineWidths)[number]>;

export type StepListItemState = 'default' | 'done' | 'active' | 'pending';

export const stepListDirections = ['vertical', 'horizontal'] as const;
export type StepListDirection = (typeof stepListDirections)[number];
