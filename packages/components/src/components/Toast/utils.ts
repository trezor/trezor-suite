import { DefaultTheme } from 'styled-components';

import { CSSColor } from '@trezor/theme';

import { ToastAction, ToastIconVariant, ToastIntent } from './types';

export const mapToastIntentToIcon = (intent: ToastIntent) => {
    const iconMap: Record<ToastIntent, ToastIconVariant> = {
        brand: 'check',
        info: 'info',
        warning: 'warning',
        critical: 'warning',
        neutral: 'info',
    };

    return iconMap[intent];
};

export const mapToastVariantToColor = (variant: ToastIntent, theme: DefaultTheme) => {
    const colorMap: Record<ToastIntent, CSSColor> = {
        brand: theme.textPrimaryDefault,
        info: theme.textAlertBlue,
        warning: theme.textAlertYellow,
        critical: theme.textAlertRed,
        neutral: theme.textSubdued,
    };

    return colorMap[variant];
};

export const normalizeToastActions = (actions: ToastAction[] = [], toastIntent: ToastIntent) =>
    actions.reduce(
        (acc, action) => {
            const normalized = {
                ...action,
                intent: action.intent ?? toastIntent,
                priority: action.priority ?? 'secondary',
                position: action.position ?? 'right',
            };

            if (normalized.position === 'bottom') {
                acc.bottomActions.push(normalized);
            } else {
                acc.rightActions.push(normalized);
            }

            return acc;
        },
        {
            bottomActions: [] as typeof actions,
            rightActions: [] as typeof actions,
        },
    );
