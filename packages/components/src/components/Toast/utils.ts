import { CheckIcon, InfoIcon, WarningIcon } from '@trezor/icons';
import { type Color } from '@trezor/theme';

import { type ToastAction, type ToastIntent } from './types';
import { type IconComponent } from '../Icon/Icon';

export const mapToastIntentToIcon = (intent: ToastIntent): IconComponent => {
    const iconMap: Record<ToastIntent, IconComponent> = {
        brand: CheckIcon,
        info: InfoIcon,
        warning: WarningIcon,
        critical: WarningIcon,
        neutral: InfoIcon,
    };

    return iconMap[intent];
};

export const mapToastVariantToColor = (variant: ToastIntent): Color => {
    const colorMap: Record<ToastIntent, Color> = {
        brand: 'contentBrand',
        info: 'contentInfo',
        warning: 'contentWarning',
        critical: 'contentCritical',
        neutral: 'contentSecondary',
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
