import { TranslationFunction } from '@suite/intl';
import { ToastAction, ToastIntent } from '@trezor/components';

import { ToastNotificationVariant } from 'src/types/suite';

import { NotificationViewProps } from '../Notifications/NotificationGroup/NotificationList/NotificationView';

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
