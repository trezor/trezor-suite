import { UIVariant, UISize, UIHorizontalAlignment, UIVerticalAlignment } from '../../config/types';
import { CSSColor } from '@trezor/theme';

export type NewModalVariant = Extract<UIVariant, 'primary' | 'warning' | 'destructive'>;

export type NewModalSize = Extract<UISize, 'large' | 'medium' | 'small' | 'tiny'>;

export type NewModalAlignment = { x: UIHorizontalAlignment; y: UIVerticalAlignment };

export type NewModalExclusiveColorOrVariant =
    | { variant?: NewModalVariant; color?: undefined }
    | {
          variant?: undefined;
          /** @deprecated Use only is case of absolute desperation. Prefer using `variant`. */
          color?: { icon: CSSColor; background: CSSColor };
      };
