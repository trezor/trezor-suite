import { TranslationFunction } from '@suite/intl';
import { ToastAction, ToastIntent } from '@trezor/components';

import { ToastNotificationVariant } from 'src/types/suite';

import { NotificationViewProps } from '../Notifications/NotificationGroup/NotificationList/NotificationView';

export const mapNotificationActionsToToastActions = (
    value: NotificationViewProps['action'],
    translate: TranslationFunction,
): ToastAction[] => {
    if (value == null) return [];

    const actions = Array.isArray(value) ? value : [value];

    return actions.map(action => ({
        ...action,
        label: translate(action.label),
    }));
};

export const mapNotificationVariantToIntent = (variant: ToastNotificationVariant): ToastIntent => {
    const variantMap: Record<ToastNotificationVariant, ToastIntent> = {
        success: 'brand',
        info: 'info',
        warning: 'warning',
        error: 'critical',
        transparent: 'neutral',
    };

    return variantMap[variant] || 'neutral';
};
