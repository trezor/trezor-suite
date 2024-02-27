import { UISize } from '../../config/types';

export type InputState = 'warning' | 'error';

export type InputSize = Extract<UISize, 'small' | 'large'>;
