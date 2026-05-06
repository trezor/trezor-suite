import { type AnchorHTMLAttributes, type ButtonHTMLAttributes, type HTMLAttributes } from 'react';

import { type UIIntent, type UIPriority, type UISize } from '../../config/types';

export const buttonIntents = [
    'brand',
    'neutral',
    'info',
    'warning',
    'critical',
    'accentViolet',
] as const;
export type ButtonIntent = Extract<UIIntent, (typeof buttonIntents)[number]>;

export const buttonSizes = ['large', 'medium', 'small'] as const;
export type ButtonSize = Extract<UISize, (typeof buttonSizes)[number]>;

export const buttonPriorities = ['primary', 'secondary'] as const;
export type ButtonPriority = Extract<UIPriority, (typeof buttonPriorities)[number]>;

export type CommonButtonProps = {
    intent?: ButtonIntent;
    priority?: ButtonPriority;
    isFloating?: boolean;
    isLoading?: boolean;
    isDisabled?: boolean;
    isInverse?: boolean;
    onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
    type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
    href?: AnchorHTMLAttributes<HTMLAnchorElement>['href'];
    target?: AnchorHTMLAttributes<HTMLAnchorElement>['target'];
    tabIndex?: HTMLAttributes<HTMLElement>['tabIndex'];
};

export type InverseKey = 'normal' | 'inverse';
