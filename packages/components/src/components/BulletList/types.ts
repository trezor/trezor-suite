import { UISize } from '../../config/types';

export const bulletSizes = ['large', 'medium', 'small'] as const;
export type BulletSize = Extract<UISize, (typeof bulletSizes)[number]>;

export type BulletListItemState = 'default' | 'done' | 'pending';
