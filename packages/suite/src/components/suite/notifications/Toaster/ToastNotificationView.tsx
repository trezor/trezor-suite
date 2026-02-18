import { JSX } from 'react';

import { ExtendedMessageDescriptor, Translation, useTranslation } from '@suite/intl';
import { NotificationEntry, notificationsActions } from '@suite-common/toast-notifications';
import { IconName, Toast } from '@trezor/components';

import { useDispatch } from 'src/hooks/suite';
import { ToastNotificationVariant } from 'src/types/suite';

import { mapNotificationActionsToToastActions, notificationVariantToIntentMap } from './utils';
import { NotificationViewProps } from '../Notifications/NotificationGroup/NotificationList/NotificationView';

export type ToastNotificationViewProps = {
    notification: NotificationEntry;
    variant: ToastNotificationVariant;
    icon?: IconName | JSX.Element;
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

    const toastIcon = typeof icon === 'string' ? icon : undefined;

    return (
        <Toast
            icon={toastIcon}
            intent={notificationVariantToIntentMap[variant] ?? 'neutral'}
            content={<Translation id={message} values={messageValues} />}
            dataTestId={notification.type}
            actions={mapNotificationActionsToToastActions(action, translationString)}
            onDismiss={handleDismiss}
        />
    );
};
