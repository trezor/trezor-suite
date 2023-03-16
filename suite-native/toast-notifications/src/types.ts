import { IconName } from '@trezor/icons';

export type ToastNotificationVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

export type ToastNotification = {
    id: number;
    icon: IconName;
    variant: ToastNotificationVariant;
    message: string;
};

export type ToastNotificationWithoutId = Omit<ToastNotification, 'id'>;

export type ToastNotificationsRootState = ToastNotification[];
