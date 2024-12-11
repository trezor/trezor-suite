import { UISize } from '../../config/types';

export const subtabsSizes = ['large', 'medium', 'small'] as const;
export type SubTabsSize = Extract<UISize, (typeof subtabsSizes)[number]>;
