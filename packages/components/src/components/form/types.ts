import { type UISize } from '../../config/types';

export const inputSizes = ['small', 'large'] as const;
export type InputSize = Extract<UISize, (typeof inputSizes)[number]>;
