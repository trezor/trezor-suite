import { type TranslationFunction } from '@suite/intl';
import { type ToastAction, type ToastIntent } from '@trezor/components';

import { type ToastNotificationVariant } from 'src/types/suite';

import { type NotificationViewProps } from '../Notifications/NotificationGroup/NotificationList/NotificationView';

export const notificationVariantToIntentMap: Record<ToastNotificationVariant, ToastIntent> = {
    success: 'brand',
    info: 'info',
    warning: 'warning',
    error: 'critical',
    transparent: 'neutral',
};

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
