import { IconProps } from '@trezor/components';
import { NotificationEntry } from '@suite-reducers/notificationReducer';
import { ExtendedMessageDescriptor, ToastNotificationVariant } from '@suite-types';

export interface ViewProps {
    notification: NotificationEntry;
    variant: ToastNotificationVariant;
    icon?: IconProps['icon'];
    message: ExtendedMessageDescriptor | ExtendedMessageDescriptor['id'];
    actionLabel?: ExtendedMessageDescriptor['id'];
    cancelable?: boolean;
    action?: () => any;
}
