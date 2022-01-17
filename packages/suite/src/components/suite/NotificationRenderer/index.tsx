import React from 'react';
import { DEVICE } from 'trezor-connect';
import { SUITE } from '@suite-actions/constants';
import ActionRenderer from './renderers/ActionRenderer';
import TransactionRenderer from './renderers/TransactionRenderer';
import { AoppProtocolRenderer, CoinProtocolRenderer } from './renderers/UriSchemeRenderers';
import type { NotificationViewProps, NotificationRendererProps } from './types';
import type { ExtendedMessageDescriptor } from '@suite-types';

export type { NotificationViewProps };

const simple = (
    View: NotificationRendererProps['render'],
    notification: NotificationRendererProps['notification'],
    variant: NotificationViewProps['variant'],
    messageId: ExtendedMessageDescriptor['id'],
    values: ExtendedMessageDescriptor['values'],
    icon?: NotificationViewProps['icon'],
) => (
    <View
        notification={notification}
        variant={variant}
        icon={icon}
        message={messageId}
        messageValues={values}
    />
);

const error = (
    View: NotificationRendererProps['render'],
    notification: NotificationRendererProps['notification'],
    messageId: ExtendedMessageDescriptor['id'],
    values: ExtendedMessageDescriptor['values'] = {
        error: notification.error,
    },
) => simple(View, notification, 'error', messageId, values);

const success = (
    View: NotificationRendererProps['render'],
    notification: NotificationRendererProps['notification'],
    messageId: ExtendedMessageDescriptor['id'],
    icon?: NotificationViewProps['icon'],
    values: ExtendedMessageDescriptor['values'] = {},
) => simple(View, notification, 'success', messageId, values, icon);

const info = (
    View: NotificationRendererProps['render'],
    notification: NotificationRendererProps['notification'],
    messageId: ExtendedMessageDescriptor['id'],
    values: ExtendedMessageDescriptor['values'] = {},
) => simple(View, notification, 'info', messageId, values);

const NotificationRenderer = ({ notification, render }: NotificationRendererProps) => {
    switch (notification.type) {
        case 'aopp-success':
            return success(render, notification, 'TOAST_AOPP_SUCCESS');
        case 'aopp-error':
            return error(render, notification, 'TOAST_AOPP_ERROR');
        case 'acquire-error':
            return error(render, notification, 'TOAST_ACQUIRE_ERROR');
        case 'auth-failed':
            return error(render, notification, 'TOAST_AUTH_FAILED');
        case 'auth-confirm-error':
            return error(render, notification, 'TOAST_AUTH_CONFIRM_ERROR', {
                error: notification.error || { id: 'TOAST_AUTH_CONFIRM_ERROR_DEFAULT' },
            });
        case 'discovery-error':
            return error(render, notification, 'TOAST_DISCOVERY_ERROR');
        case 'backup-failed':
            return error(render, notification, 'TOAST_BACKUP_FAILED');
        case 'backup-success':
            return success(render, notification, 'TOAST_BACKUP_SUCCESS', 'SETTINGS');
        case 'settings-applied':
            return success(render, notification, 'TOAST_SETTINGS_APPLIED', 'SETTINGS');
        case 'pin-changed':
            return success(render, notification, 'TOAST_PIN_CHANGED', 'SETTINGS');
        case 'device-wiped':
            return success(render, notification, 'TOAST_DEVICE_WIPED', 'SETTINGS');
        case 'copy-to-clipboard':
            return success(render, notification, 'TOAST_COPY_TO_CLIPBOARD');
        case 'raw-tx-sent':
            return success(render, notification, 'TOAST_RAW_TX_SENT', 'SEND', {
                txid: notification.txid,
            });
        case 'sign-tx-error':
            return error(render, notification, 'TOAST_SIGN_TX_ERROR');
        case 'verify-address-error':
            return error(render, notification, 'TOAST_VERIFY_ADDRESS_ERROR');
        case 'sign-message-error':
            return error(render, notification, 'TOAST_SIGN_MESSAGE_ERROR');
        case 'verify-message-error':
            return error(render, notification, 'TOAST_VERIFY_MESSAGE_ERROR');
        case 'sign-message-success':
            return success(render, notification, 'TOAST_SIGN_MESSAGE_SUCCESS');
        case 'verify-message-success':
            return success(render, notification, 'TOAST_VERIFY_MESSAGE_SUCCESS');
        case 'error':
            return error(render, notification, 'TOAST_GENERIC_ERROR');
        case 'clear-storage':
            return success(render, notification, 'TR_STORAGE_CLEARED');
        case 'bridge-dev-restart':
            return info(
                render,
                notification,
                notification.devMode ? 'TR_BRIDGE_DEV_MODE_START' : 'TR_BRIDGE_DEV_MODE_STOP',
            );
        case 'metadata-not-found-error':
            return error(render, notification, 'METADATA_PROVIDER_NOT_FOUND_ERROR');
        case 'metadata-auth-error':
            return error(render, notification, 'METADATA_PROVIDER_AUTH_ERROR');
        case 'metadata-unexpected-error':
            return error(render, notification, 'METADATA_PROVIDER_UNEXPECTED_ERROR');
        case 'auto-updater-error':
            return error(render, notification, 'TOAST_AUTO_UPDATER_ERROR', {
                state: notification.state,
            });
        case 'auto-updater-no-new':
            return info(render, notification, 'TOAST_AUTO_UPDATER_NO_NEW');
        case 'auto-updater-new-version-first-run':
            return info(render, notification, 'TOAST_AUTO_UPDATER_NEW_VERSION_FIRST_RUN', {
                version: notification.version,
            });
        case 'add-token-success':
            return success(render, notification, 'TR_ADD_TOKEN_TOAST_SUCCESS');
        case 'user-feedback-send-success':
            return success(render, notification, 'TR_GUIDE_FEEDBACK_SENT');
        case 'user-feedback-send-error':
            return error(render, notification, 'TR_GUIDE_FEEDBACK_ERROR');
        case 'coin-scheme-protocol':
            return <CoinProtocolRenderer render={render} notification={notification} />;
        case 'aopp-protocol':
            return <AoppProtocolRenderer render={render} notification={notification} />;
        case 'tx-received':
            return (
                <TransactionRenderer
                    render={render}
                    notification={notification}
                    icon="RECEIVE"
                    variant="info"
                    message="TOAST_TX_RECEIVED"
                    messageValues={{
                        amount: notification.formattedAmount,
                        account: notification.descriptor,
                    }}
                />
            );
        case 'tx-sent':
            return (
                <TransactionRenderer
                    render={render}
                    notification={notification}
                    icon="SEND"
                    variant="success"
                    message="TOAST_TX_SENT"
                    messageValues={{
                        amount: notification.formattedAmount,
                        account: notification.descriptor,
                    }}
                />
            );
        case 'tx-confirmed':
            return (
                <TransactionRenderer
                    render={render}
                    notification={notification}
                    variant="info"
                    message="TOAST_TX_CONFIRMED"
                    messageValues={{
                        amount: notification.formattedAmount,
                        account: notification.descriptor,
                    }}
                />
            );
        // Events:
        case SUITE.AUTH_DEVICE:
            return info(render, notification, 'EVENT_WALLET_CREATED');
        case DEVICE.CONNECT:
            return (
                <ActionRenderer
                    render={render}
                    notification={notification}
                    variant="info"
                    message="EVENT_DEVICE_CONNECT"
                    messageValues={{
                        label: notification.device.label,
                    }}
                />
            );
        case DEVICE.CONNECT_UNACQUIRED:
            return (
                <ActionRenderer
                    render={render}
                    notification={notification}
                    variant="warning"
                    message="EVENT_DEVICE_CONNECT_UNACQUIRED"
                    messageValues={{
                        label: { id: 'TR_UNACQUIRED' },
                    }}
                />
            );
        default:
            return info(render, notification, 'TR_404_DESCRIPTION');
    }
};

export default NotificationRenderer;
