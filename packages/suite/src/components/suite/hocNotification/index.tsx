import React from 'react';
import { IconProps } from '@trezor/components';
import { DEVICE } from 'trezor-connect';
import { SUITE } from '@suite-actions/constants';
import { NotificationEntry } from '@suite-reducers/notificationReducer';
import messages from '@suite/support/messages';
import { ExtendedMessageDescriptor, ToastNotificationVariant } from '@suite-types';
import withAction from './components/withAction';
import withTransaction from './components/withTransaction';

export interface ViewProps {
    notification: NotificationEntry;
    variant: ToastNotificationVariant;
    icon?: IconProps['icon'];
    message: ExtendedMessageDescriptor;
    actionLabel?: ExtendedMessageDescriptor;
    cancelable?: boolean;
    action?: () => any;
}

const simple = (View: React.ComponentType<ViewProps>, props: ViewProps) => {
    return <View key={props.notification.id} {...props} />;
};

/**
 * HOC component for `state.notifications` views
 * Used by `ToastNotification` and `@suite-views/notifications` page
 * Pass intl objects into requested View
 * @param {NotificationEntry} notification
 * @param {React.ComponentType<ViewProps>} View
 */
const hocNotification = (notification: NotificationEntry, View: React.ComponentType<ViewProps>) => {
    switch (notification.type) {
        case 'acquire-error':
            return withAction(View, {
                notification,
                variant: 'error',
                message: {
                    ...messages.TOAST_ACQUIRE_ERROR,
                    values: {
                        error: notification.error,
                    },
                },
                actionLabel: messages.TR_RETRY,
            });

        case 'auth-failed':
            return withAction(View, {
                notification,
                variant: 'error',
                message: {
                    ...messages.TOAST_AUTH_FAILED,
                    values: {
                        error: notification.error,
                    },
                },
                actionLabel: messages.TR_RETRY,
            });

        case 'auth-confirm-error':
            return withAction(View, {
                notification,
                variant: 'error',
                message: {
                    ...messages.TOAST_AUTH_CONFIRM_ERROR,
                    values: {
                        error: notification.error || messages.TOAST_AUTH_CONFIRM_ERROR_DEFAULT,
                    },
                },
                actionLabel: messages.TR_RETRY,
            });

        case 'discovery-error':
            return withAction(View, {
                notification,
                variant: 'error',
                message: {
                    ...messages.TOAST_DISCOVERY_ERROR,
                    values: {
                        error: notification.error,
                    },
                },
                actionLabel: messages.TR_RETRY,
            });

        case 'backup-failed':
            return simple(View, {
                notification,
                variant: 'error',
                message: messages.TOAST_BACKUP_FAILED,
            });

        case 'backup-success':
            return simple(View, {
                notification,
                icon: 'SETTINGS',
                variant: 'success',
                message: messages.TOAST_BACKUP_SUCCESS,
            });

        case 'settings-applied':
            return simple(View, {
                notification,
                icon: 'SETTINGS',
                variant: 'success',
                message: messages.TOAST_SETTINGS_APPLIED,
            });

        case 'pin-changed':
            return simple(View, {
                notification,
                icon: 'SETTINGS',
                variant: 'success',
                message: messages.TOAST_PIN_CHANGED,
            });

        case 'device-wiped':
            return simple(View, {
                notification,
                icon: 'SETTINGS',
                variant: 'success',
                message: messages.TOAST_DEVICE_WIPED,
            });

        case 'copy-to-clipboard':
            return simple(View, {
                notification,
                variant: 'success',
                message: messages.TOAST_COPY_TO_CLIPBOARD,
            });

        case 'tx-received':
            return withTransaction(View, {
                notification,
                icon: 'RECEIVE',
                variant: 'info',
                message: {
                    ...messages.TOAST_TX_RECEIVED,
                    values: {
                        amount: notification.formattedAmount,
                        account: notification.descriptor,
                    },
                },
                actionLabel: messages.TOAST_TX_BUTTON,
            });

        case 'tx-sent':
            return withTransaction(View, {
                notification,
                icon: 'SEND',
                variant: 'success',
                message: {
                    ...messages.TOAST_TX_SENT,
                    values: {
                        amount: notification.formattedAmount,
                        account: notification.descriptor,
                    },
                },
                actionLabel: messages.TOAST_TX_BUTTON,
            });

        case 'raw-tx-sent':
            return simple(View, {
                notification,
                icon: 'SEND',
                variant: 'success',
                message: {
                    ...messages.TOAST_RAW_TX_SENT,
                    values: {
                        txid: notification.txid,
                    },
                },
            });

        case 'tx-confirmed':
            return withTransaction(View, {
                notification,
                variant: 'info',
                message: {
                    ...messages.TOAST_TX_CONFIRMED,
                    values: {
                        amount: notification.formattedAmount,
                        account: notification.descriptor,
                    },
                },
                actionLabel: messages.TOAST_TX_BUTTON,
            });

        case 'sign-tx-error':
            return simple(View, {
                notification,
                variant: 'error',
                message: {
                    ...messages.TOAST_SIGN_TX_ERROR,
                    values: {
                        error: notification.error,
                    },
                },
            });

        case 'verify-address-error':
            return simple(View, {
                notification,
                variant: 'error',
                message: {
                    ...messages.TOAST_VERIFY_ADDRESS_ERROR,
                    values: {
                        error: notification.error,
                    },
                },
            });

        case 'sign-message-error':
            return simple(View, {
                notification,
                variant: 'error',
                message: {
                    ...messages.TOAST_SIGN_MESSAGE_ERROR,
                    values: {
                        error: notification.error,
                    },
                },
            });

        case 'verify-message-error':
            return simple(View, {
                notification,
                variant: 'error',
                message: {
                    ...messages.TOAST_VERIFY_MESSAGE_ERROR,
                    values: {
                        error: notification.error,
                    },
                },
            });

        case 'error':
            return simple(View, {
                notification,
                variant: 'error',
                message: {
                    ...messages.TOAST_GENERIC_ERROR,
                    values: {
                        error: notification.error,
                    },
                },
            });

        case 'clear-storage':
            return simple(View, {
                notification,
                variant: 'success',
                message: messages.TR_STORAGE_CLEARED,
            });

        case 'bridge-dev-restart':
            return simple(View, {
                notification,
                variant: 'info',
                message: notification.devMode
                    ? messages.TR_BRIDGE_DEV_MODE_START
                    : messages.TR_BRIDGE_DEV_MODE_STOP,
            });

        case 'metadata-not-found-error':
            return simple(View, {
                notification,
                variant: 'error',
                message: messages.METADATA_PROVIDER_NOT_FOUND_ERROR,
            });

        case 'metadata-auth-error':
            return simple(View, {
                notification,
                variant: 'error',
                message: messages.METADATA_PROVIDER_AUTH_ERROR,
            });

        case 'metadata-unexpected-error':
            return simple(View, {
                notification,
                variant: 'error',
                message: messages.METADATA_PROVIDER_UNEXPECTED_ERROR,
            });

        case 'auto-updater-error':
            return simple(View, {
                notification,
                variant: 'error',
                message: {
                    ...messages.TOAST_AUTO_UPDATER_ERROR,
                    values: {
                        state: notification.state,
                    },
                },
            });

        // Events:
        case DEVICE.CONNECT:
            return withAction(View, {
                notification,
                variant: 'info',
                message: {
                    ...messages.EVENT_DEVICE_CONNECT,
                    values: {
                        label: notification.device.label,
                    },
                },
                actionLabel: messages.TR_SELECT_DEVICE,
            });

        case DEVICE.CONNECT_UNACQUIRED:
            return withAction(View, {
                notification,
                variant: 'warning',
                message: {
                    ...messages.EVENT_DEVICE_CONNECT_UNACQUIRED,
                    values: {
                        label: messages.TR_UNACQUIRED,
                    },
                },
                actionLabel: messages.TR_SOLVE_ISSUE,
            });

        case SUITE.AUTH_DEVICE:
            return simple(View, {
                notification,
                variant: 'info',
                message: {
                    ...messages.EVENT_WALLET_CREATED,
                    values: {
                        walletLabel: 'New wallet',
                    },
                },
            });

        default:
            return simple(View, {
                notification,
                variant: 'info',
                message: {
                    // TODO: proper msg definition
                    id: notification.type as 'TR_404_DESCRIPTION',
                    defaultMessage: notification.type,
                },
            });
    }
};

export default hocNotification;
