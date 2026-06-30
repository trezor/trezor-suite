import { type ReactNode } from 'react';

import { type ExtendedMessageDescriptor, Translation, useTranslation } from '@suite/intl';
import { type NotificationEntry, notificationsActions } from '@suite-common/toast-notifications';
import { type IconComponent, Toast } from '@trezor/components';

import { useDispatch } from 'src/hooks/suite';
import { type ToastNotificationVariant } from 'src/types/suite';

import { mapNotificationActionsToToastActions, notificationVariantToIntentMap } from './utils';
import { type NotificationViewProps } from '../Notifications/NotificationGroup/NotificationList/NotificationView';

export type ToastNotificationViewProps = {
    notification: NotificationEntry;
    variant: ToastNotificationVariant;
    icon?: IconComponent | ReactNode;
    message: ExtendedMessageDescriptor['id'];
    messageValues: ExtendedMessageDescriptor['values'];
    action?: NotificationViewProps['action'];
    onCancel?: () => void;
};

export const ToastNotificationView = ({
    notification,
    variant,
    icon,
    message,
    messageValues,
    action,
    onCancel,
}: ToastNotificationViewProps) => {
    const { translationString } = useTranslation();
    const dispatch = useDispatch();

    const handleDismiss = () => {
        dispatch(notificationsActions.close(notification.id));
        onCancel?.();
    };

    const toastIcon = typeof icon === 'function' ? icon : undefined;

    return (
        <Toast
            icon={toastIcon}
            intent={notificationVariantToIntentMap[variant] ?? 'neutral'}
            content={<Translation id={message} values={messageValues} />}
            dataTestId={notification.type}
            actions={mapNotificationActionsToToastActions(action, translationString)}
            onDismiss={handleDismiss}
            dismissTooltip={<Translation id="TR_DISMISS" />}
        />
    );
};
