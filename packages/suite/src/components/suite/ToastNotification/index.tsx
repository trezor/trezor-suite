import React from 'react';
import { NotificationEntry } from '@suite-reducers/notificationReducer';
import { Translation } from '@suite-components';
import messages from '@suite/support/messages';
import Toast from './components/Toast';
import { Dispatch } from '@suite-types';

import * as suiteActions from '@suite-actions/suiteActions';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import * as routerActions from '@suite-actions/routerActions';

export const getContent = (notification: NotificationEntry, dispatch: Dispatch) => {
    switch (notification.type) {
        case 'acquire-error':
            return (
                <Toast
                    text={
                        <Translation
                            {...messages.TOAST_ACQUIRE_ERROR}
                            values={{ error: notification.error }}
                        />
                    }
                    actionLabel={<Translation {...messages.TR_RETRY} />}
                    action={() =>
                        dispatch(suiteActions.acquireDevice(notification.acquiringDevice))
                    }
                />
            );
        case 'auth-failed':
            return (
                <Toast
                    text={
                        <Translation
                            {...messages.TOAST_AUTH_FAILED}
                            values={{ error: notification.error }}
                        />
                    }
                    actionLabel={<Translation {...messages.TR_RETRY} />}
                    action={() => dispatch(suiteActions.authorizeDevice())}
                />
            );
        case 'auth-confirm-error':
            return (
                <Toast
                    text={
                        <Translation
                            {...messages.TOAST_AUTH_CONFIRM_ERROR}
                            values={{
                                // use default error if generic error is not set
                                error: notification.error || (
                                    <Translation {...messages.TOAST_AUTH_CONFIRM_ERROR_DEFAULT} />
                                ),
                            }}
                        />
                    }
                    actionLabel={<Translation {...messages.TR_RETRY} />}
                    action={() => dispatch(suiteActions.authConfirm())}
                />
            );
        case 'discovery-error':
            return (
                <Toast
                    text={
                        <Translation
                            {...messages.TOAST_DISCOVERY_ERROR}
                            values={{ error: notification.error }}
                        />
                    }
                    actionLabel={<Translation {...messages.TR_RETRY} />}
                    action={() => dispatch(discoveryActions.restart())}
                />
            );
        case 'backup-failed':
            return <Toast text={<Translation {...messages.TOAST_BACKUP_FAILED} />} />;
        case 'backup-success':
            return <Toast text={<Translation {...messages.TOAST_BACKUP_SUCCESS} />} />;

        case 'settings-applied':
            return <Toast text={<Translation {...messages.TOAST_SETTINGS_APPLIED} />} />;
        case 'pin-changed':
            return <Toast text={<Translation {...messages.TOAST_PIN_CHANGED} />} />;
        case 'device-wiped':
            return <Toast text={<Translation {...messages.TOAST_DEVICE_WIPED} />} />;
        case 'copy-to-clipboard':
            return <Toast text={<Translation {...messages.TOAST_COPY_TO_CLIPBOARD} />} />;

        case 'tx-confirmed':
            return (
                <Toast
                    text={
                        <Translation
                            {...messages.TOAST_TX_CONFIRMED}
                            values={{ amount: notification.amount }}
                        />
                    }
                    actionLabel={<Translation {...messages.TOAST_TX_CONFIRMED_CTA} />}
                    action={async () => {
                        // select device
                        if (notification.accountDevice) {
                            await dispatch(suiteActions.selectDevice(notification.accountDevice));
                        }
                        // go to account route
                        if (notification.routeParams) {
                            dispatch(routerActions.goto('wallet-index', notification.routeParams));
                        }
                    }}
                />
            );
        case 'sign-tx-success':
            // TODO: cta here?
            return (
                <Toast
                    text={
                        <Translation
                            {...messages.TOAST_SIGN_TX_SUCCESS}
                            values={{ txid: notification.txid }}
                        />
                    }
                />
            );
        case 'sign-tx-error':
            return (
                <Toast
                    text={
                        <Translation
                            {...messages.TOAST_SIGN_TX_ERROR}
                            values={{ error: notification.error }}
                        />
                    }
                />
            );
        case 'verify-address-error':
            return (
                <Toast
                    text={
                        <Translation
                            {...messages.TOAST_VERIFY_ADDRESS_ERROR}
                            values={{ error: notification.error }}
                        />
                    }
                />
            );
        case 'sign-message-error':
            return (
                <Toast
                    text={
                        <Translation
                            {...messages.TOAST_SIGN_MESSAGE_ERROR}
                            values={{ error: notification.error }}
                        />
                    }
                />
            );
        case 'verify-message-error':
            return (
                <Toast
                    text={
                        <Translation
                            {...messages.TOAST_VERIFY_MESSAGE_ERROR}
                            values={{ error: notification.error }}
                        />
                    }
                />
            );
        case 'error': // this remove?
            return (
                <Toast
                    text={
                        <Translation
                            {...messages.TOAST_GENERIC_ERROR}
                            values={{ error: notification.error }}
                        />
                    }
                />
            );
        default:
            return <Toast text={notification.type} />;
    }
};
