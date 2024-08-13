import { UISize } from '../../config/types';

export type InputState = 'warning' | 'error' | 'primary';

export type InputSize = Extract<UISize, 'small' | 'large'>;
