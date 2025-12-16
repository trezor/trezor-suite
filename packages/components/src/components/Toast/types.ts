import { ReactNode } from 'react';

import { UIIntent } from '../../config/types';
import { ButtonIntent, ButtonPriority } from '../buttons/types';

export const toastIntents = ['brand', 'neutral', 'info', 'warning', 'critical'] as const;
export type ToastIntent = Extract<UIIntent, (typeof toastIntents)[number]>;

export type ToastIconVariant = 'info' | 'warning' | 'check';

export type ToastActionPosition = 'right' | 'bottom';

export type ToastAction = {
    label: ReactNode;
    position?: ToastActionPosition;
    intent?: ButtonIntent;
    priority?: ButtonPriority;
    onClick?: () => void;
};
