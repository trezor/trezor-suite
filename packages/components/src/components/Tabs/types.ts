import { UISize } from '../../config/types';

export const tabsSizes = ['large', 'medium', 'small'] as const;
export type TabsSize = Extract<UISize, (typeof tabsSizes)[number]>;
