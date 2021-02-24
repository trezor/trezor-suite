import React from 'react';
import { DEVICE } from 'trezor-connect';
import { SUITE } from '@suite-actions/constants';
import { NotificationEntry } from '@suite-reducers/notificationReducer';
import withAction from './components/withAction';
import withTransaction from './components/withTransaction';
import { ViewProps } from './definitions';

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
                    id: 'TOAST_ACQUIRE_ERROR',
                    values: {
                        error: notification.error,
                    },
                },
                actionLabel: 'TR_RETRY',
            });

        case 'auth-failed':
            return withAction(View, {
                notification,
                variant: 'error',
                message: {
                    id: 'TOAST_AUTH_FAILED',
                    values: {
                        error: notification.error,
                    },
                },
                actionLabel: 'TR_RETRY',
            });

        case 'auth-confirm-error':
            return withAction(View, {
                notification,
                variant: 'error',
                message: {
                    id: 'TOAST_AUTH_CONFIRM_ERROR',
                    values: {
                        error: notification.error || { id: 'TOAST_AUTH_CONFIRM_ERROR_DEFAULT' },
                    },
                },
                actionLabel: 'TR_RETRY',
            });

        case 'discovery-error':
            return withAction(View, {
                notification,
                variant: 'error',
                message: {
                    id: 'TOAST_DISCOVERY_ERROR',
                    values: {
                        error: notification.error,
                    },
                },
                actionLabel: 'TR_RETRY',
            });

        case 'backup-failed':
            return simple(View, {
                notification,
                variant: 'error',
                message: 'TOAST_BACKUP_FAILED',
            });

        case 'backup-success':
            return simple(View, {
                notification,
                icon: 'SETTINGS',
                variant: 'success',
                message: 'TOAST_BACKUP_SUCCESS',
            });

        case 'settings-applied':
            return simple(View, {
                notification,
                icon: 'SETTINGS',
                variant: 'success',
                message: 'TOAST_SETTINGS_APPLIED',
            });

        case 'pin-changed':
            return simple(View, {
                notification,
                icon: 'SETTINGS',
                variant: 'success',
                message: 'TOAST_PIN_CHANGED',
            });

        case 'device-wiped':
            return simple(View, {
                notification,
                icon: 'SETTINGS',
                variant: 'success',
                message: 'TOAST_DEVICE_WIPED',
            });

        case 'copy-to-clipboard':
            return simple(View, {
                notification,
                variant: 'success',
                message: 'TOAST_COPY_TO_CLIPBOARD',
            });

        case 'tx-received':
            return withTransaction(View, {
                notification,
                icon: 'RECEIVE',
                variant: 'info',
                message: {
                    id: 'TOAST_TX_RECEIVED',
                    values: {
                        amount: notification.formattedAmount,
                        account: notification.descriptor,
                    },
                },
                actionLabel: 'TOAST_TX_BUTTON',
            });

        case 'tx-sent':
            return withTransaction(View, {
                notification,
                icon: 'SEND',
                variant: 'success',
                message: {
                    id: 'TOAST_TX_SENT',
                    values: {
                        amount: notification.formattedAmount,
                        account: notification.descriptor,
                    },
                },
                actionLabel: 'TOAST_TX_BUTTON',
            });

        case 'raw-tx-sent':
            return simple(View, {
                notification,
                icon: 'SEND',
                variant: 'success',
                message: {
                    id: 'TOAST_RAW_TX_SENT',
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
                    id: 'TOAST_TX_CONFIRMED',
                    values: {
                        amount: notification.formattedAmount,
                        account: notification.descriptor,
                    },
                },
                actionLabel: 'TOAST_TX_BUTTON',
            });

        case 'sign-tx-error':
            return simple(View, {
                notification,
                variant: 'error',
                message: {
                    id: 'TOAST_SIGN_TX_ERROR',
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
                    id: 'TOAST_VERIFY_ADDRESS_ERROR',
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
                    id: 'TOAST_SIGN_MESSAGE_ERROR',
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
                    id: 'TOAST_VERIFY_MESSAGE_ERROR',
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
                    id: 'TOAST_GENERIC_ERROR',
                    values: {
                        error: notification.error,
                    },
                },
            });

        case 'clear-storage':
            return simple(View, {
                notification,
                variant: 'success',
                message: 'TR_STORAGE_CLEARED',
            });

        case 'bridge-dev-restart':
            return simple(View, {
                notification,
                variant: 'info',
                message: notification.devMode
                    ? 'TR_BRIDGE_DEV_MODE_START'
                    : 'TR_BRIDGE_DEV_MODE_STOP',
            });

        case 'metadata-not-found-error':
            return simple(View, {
                notification,
                variant: 'error',
                message: 'METADATA_PROVIDER_NOT_FOUND_ERROR',
            });

        case 'metadata-auth-error':
            return simple(View, {
                notification,
                variant: 'error',
                message: 'METADATA_PROVIDER_AUTH_ERROR',
            });

        case 'metadata-unexpected-error':
            return simple(View, {
                notification,
                variant: 'error',
                message: 'METADATA_PROVIDER_UNEXPECTED_ERROR',
            });

        case 'auto-updater-error':
            return simple(View, {
                notification,
                variant: 'error',
                message: {
                    id: 'TOAST_AUTO_UPDATER_ERROR',
                    values: {
                        state: notification.state,
                    },
                },
            });

        case 'auto-updater-no-new':
            return simple(View, {
                notification,
                variant: 'info',
                message: 'TOAST_AUTO_UPDATER_NO_NEW',
            });

        case 'add-token-success':
            return simple(View, {
                notification,
                variant: 'success',
                message: 'TR_ADD_TOKEN_TOAST_SUCCESS',
            });

        // Events:
        case DEVICE.CONNECT:
            return withAction(View, {
                notification,
                variant: 'info',
                message: {
                    id: 'EVENT_DEVICE_CONNECT',
                    values: {
                        label: notification.device.label,
                    },
                },
                actionLabel: 'TR_SELECT_DEVICE',
            });

        case DEVICE.CONNECT_UNACQUIRED:
            return withAction(View, {
                notification,
                variant: 'warning',
                message: {
                    id: 'EVENT_DEVICE_CONNECT_UNACQUIRED',
                    values: {
                        label: { id: 'TR_UNACQUIRED' },
                    },
                },
                actionLabel: 'TR_SOLVE_ISSUE',
            });

        case SUITE.AUTH_DEVICE:
            return simple(View, {
                notification,
                variant: 'info',
                message: {
                    id: 'EVENT_WALLET_CREATED',
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
