import { UIVariant, UISize, UIHorizontalAlignment, UIVerticalAlignment } from '../../config/types';

export type NewModalVariant = Extract<UIVariant, 'primary' | 'warning' | 'destructive'> | 'purple';

export type NewModalSize = Extract<UISize, 'large' | 'medium' | 'small' | 'tiny'>;

export type NewModalAlignment = { x: UIHorizontalAlignment; y: UIVerticalAlignment };
