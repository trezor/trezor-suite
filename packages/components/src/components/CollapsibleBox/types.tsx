import { UISize } from '../../config/types';

export const paddingTypes = ['none', 'normal', 'large'] as const;
export type PaddingType = (typeof paddingTypes)[number];

export const fillTypes = ['none', 'default'] as const;
export type FillType = (typeof fillTypes)[number];

export const headingSizes = ['small', 'medium', 'large'] as const satisfies UISize[];
export type HeadingSize = (typeof headingSizes)[number];
