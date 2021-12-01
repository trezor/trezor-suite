import type { ComponentType } from 'react';
import type { IconProps, ButtonProps } from '@trezor/components';
import type { NotificationEntry } from '@suite-reducers/notificationReducer';
import type { ExtendedMessageDescriptor, ToastNotificationVariant } from '@suite-types';

export interface NotificationViewProps {
    notification: NotificationEntry;
    variant: ToastNotificationVariant;
    icon?: IconProps['icon'] | JSX.Element;
    message: ExtendedMessageDescriptor['id'];
    messageValues: ExtendedMessageDescriptor['values'];
    action?: {
        onClick: () => void;
        label: ExtendedMessageDescriptor['id'];
        position?: 'bottom' | 'right';
        variant?: ButtonProps['variant'];
    };
    cancelable?: boolean;
    onCancel?: () => void; // additional event which should happen when notification is closing
}

export type NotificationView = ComponentType<NotificationViewProps>;

export type NotificationRendererProps<
    T extends NotificationEntry['type'] = NotificationEntry['type'],
> = {
    render: NotificationView;
    notification: Extract<NotificationEntry, { type: T }>;
};
