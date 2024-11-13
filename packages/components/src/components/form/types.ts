import { UISize } from '../../config/types';

export type InputState = 'warning' | 'error' | 'primary' | 'default';

export type InputSize = Extract<UISize, 'small' | 'large'>;
