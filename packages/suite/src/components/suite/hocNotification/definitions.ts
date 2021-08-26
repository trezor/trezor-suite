import type { IconProps, ButtonProps } from '@trezor/components';
import type { NotificationEntry } from '@suite-reducers/notificationReducer';
import type { ExtendedMessageDescriptor, ToastNotificationVariant } from '@suite-types';

export interface ViewProps {
    notification: NotificationEntry;
    variant: ToastNotificationVariant;
    icon?: IconProps['icon'] | JSX.Element;
    message: ExtendedMessageDescriptor | ExtendedMessageDescriptor['id'];
    action?: {
        onClick: () => void;
        label: ExtendedMessageDescriptor['id'];
        position?: 'bottom' | 'right';
        variant?: ButtonProps['variant'];
    };
    cancelable?: boolean;
    onCancel?: () => void; // additional event which should happen when notification is closing
}
