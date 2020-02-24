import { IconProps } from '@trezor/components';
import { SUITE } from '@suite-actions/constants';
import { NotificationEntry } from '@suite-reducers/notificationReducer';
import messages from '@suite/support/messages';
import { Dispatch, ExtendedMessageDescriptor } from '@suite-types';

import * as suiteActions from '@suite-actions/suiteActions';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import * as routerActions from '@suite-actions/routerActions';

export interface NotificationMessage {
    icon?: IconProps['icon'];
    message: ExtendedMessageDescriptor;
    actionLabel?: ExtendedMessageDescriptor;
    action?: () => any;
}

export const getNotificationMessage = (
    notification: NotificationEntry,
    dispatch: Dispatch,
): NotificationMessage => {
    switch (notification.type) {
        case 'acquire-error':
            return {
                icon: 'WARNING',
                message: {
                    ...messages.TOAST_ACQUIRE_ERROR,
                    values: {
                        error: notification.error,
                    },
                },
                actionLabel: messages.TR_RETRY,
                action: () => dispatch(suiteActions.acquireDevice(notification.device)),
            };
        case 'auth-failed':
            return {
                icon: 'WARNING',
                message: {
                    ...messages.TOAST_AUTH_FAILED,
                    values: {
                        error: notification.error,
                    },
                },
                actionLabel: messages.TR_RETRY,
                action: () => dispatch(suiteActions.authorizeDevice()),
            };
        case 'auth-confirm-error':
            return {
                icon: 'WARNING',
                message: {
                    ...messages.TOAST_AUTH_CONFIRM_ERROR,
                    values: {
                        error: notification.error || messages.TOAST_AUTH_CONFIRM_ERROR_DEFAULT,
                    },
                },
                actionLabel: messages.TR_RETRY,
                action: () => dispatch(suiteActions.authConfirm()),
            };
        case 'discovery-error':
            return {
                icon: 'WARNING',
                message: {
                    ...messages.TOAST_DISCOVERY_ERROR,
                    values: {
                        error: notification.error,
                    },
                },
                actionLabel: messages.TR_RETRY,
                action: () => dispatch(discoveryActions.restart()),
            };
        case 'backup-failed':
            return {
                icon: 'WARNING',
                message: messages.TOAST_BACKUP_FAILED,
            };
        case 'backup-success':
            return {
                icon: 'SETTINGS',
                message: messages.TOAST_BACKUP_SUCCESS,
            };
        case 'settings-applied':
            return {
                icon: 'SETTINGS',
                message: messages.TOAST_SETTINGS_APPLIED,
            };
        case 'pin-changed':
            return {
                icon: 'SETTINGS',
                message: messages.TOAST_PIN_CHANGED,
            };
        case 'device-wiped':
            return {
                icon: 'SETTINGS',
                message: messages.TOAST_DEVICE_WIPED,
            };
        case 'copy-to-clipboard':
            return {
                icon: 'INFO',
                message: messages.TOAST_COPY_TO_CLIPBOARD,
            };
        case 'tx-confirmed':
            return {
                icon: 'RECEIVE',
                message: {
                    ...messages.TOAST_TX_CONFIRMED,
                    values: {
                        amount: notification.amount,
                    },
                },
                actionLabel: messages.TOAST_TX_CONFIRMED_CTA,
                action: async () => {
                    // select device
                    if (notification.device) {
                        await dispatch(suiteActions.selectDevice(notification.device));
                    }
                    // go to account route
                    if (notification.routeParams) {
                        dispatch(routerActions.goto('wallet-index', notification.routeParams));
                    }
                },
            };
        case 'sign-tx-success':
            return {
                icon: 'SEND',
                message: {
                    ...messages.TOAST_SIGN_TX_SUCCESS,
                    values: {
                        txid: notification.txid,
                    },
                },
            };
        case 'sign-tx-error':
            return {
                icon: 'WARNING',
                message: {
                    ...messages.TOAST_SIGN_TX_ERROR,
                    values: {
                        error: notification.error,
                    },
                },
            };
        case 'verify-address-error':
            return {
                icon: 'WARNING',
                message: {
                    ...messages.TOAST_VERIFY_ADDRESS_ERROR,
                    values: {
                        error: notification.error,
                    },
                },
            };
        case 'sign-message-error':
            return {
                icon: 'WARNING',
                message: {
                    ...messages.TOAST_SIGN_MESSAGE_ERROR,
                    values: {
                        error: notification.error,
                    },
                },
            };
        case 'verify-message-error':
            return {
                icon: 'WARNING',
                message: {
                    ...messages.TOAST_VERIFY_MESSAGE_ERROR,
                    values: {
                        error: notification.error,
                    },
                },
            };
        case 'error':
            return {
                icon: 'WARNING',
                message: {
                    ...messages.TOAST_GENERIC_ERROR,
                    values: {
                        error: notification.error,
                    },
                },
            };

        // Events:
        case SUITE.AUTH_DEVICE:
            return {
                icon: 'INFO',
                message: {
                    id: 'unknown',
                    defaultMessage: 'Wallet created',
                },
            };

        default:
            return {
                icon: 'INFO',
                message: {
                    id: 'unknown',
                    defaultMessage: notification.type,
                },
            };
    }
};
