import { ComponentType, JSX } from 'react';
import { useSelector } from 'react-redux';

import { ExtendedMessageDescriptor } from '@suite-common/intl-types';
import { AUTH_DEVICE, type NotificationEntry } from '@suite-common/toast-notifications';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { selectSelectedDeviceLabelOrName } from '@suite-common/wallet-core';
import { DEVICE } from '@trezor/connect';
import { exhaustive } from '@trezor/type-utils';

import type { NotificationViewProps } from 'src/components/suite/notifications/Notifications/NotificationGroup/NotificationList/NotificationView';

import { ActionRenderer } from './ActionRenderer';
import { AutoEjectRenderer } from './AutoEjectRenderer';
import { CoinProtocolRenderer } from './CoinProtocolRenderer';
import { ExchangeInfoRenderer } from './ExchangeInfoRenderer';
import { TransactionRenderer } from './TransactionRenderer';
import { Translation } from '../../Translation';

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
    icon?: NotificationViewProps['icon'],
) => simple(View, notification, 'info', messageId, values, icon);

export type NotificationRendererProps<
    T extends NotificationEntry['type'] = NotificationEntry['type'],
> = {
    render: ComponentType<{ onCancel?: () => void } & NotificationViewProps>;
    notification: Extract<NotificationEntry, { type: T }>;
};

export const NotificationRenderer = ({
    notification,
    render,
}: NotificationRendererProps): JSX.Element => {
    const deviceLabel = useSelector(selectSelectedDeviceLabelOrName);

    const { type } = notification;

    switch (type) {
        case 'acquire-error':
            return error(render, notification, 'TOAST_ACQUIRE_ERROR');
        case 'auth-confirm-error':
            return error(render, notification, 'TOAST_AUTH_CONFIRM_ERROR', {
                error: notification.error || <Translation id="TOAST_AUTH_CONFIRM_ERROR_DEFAULT" />,
            });
        case 'discovery-error':
            return error(render, notification, 'TOAST_DISCOVERY_ERROR');
        case 'backup-failed':
            return error(render, notification, 'TOAST_BACKUP_FAILED');
        case 'backup-success':
            return success(render, notification, 'TOAST_BACKUP_SUCCESS', 'gear');
        case 'settings-applied':
            return success(render, notification, 'TOAST_SETTINGS_APPLIED', 'gear');
        case 'pin-changed':
            return success(render, notification, 'TOAST_PIN_CHANGED', 'gear');
        case 'wipe-code-changed':
            return success(render, notification, 'TOAST_WIPE_CODE_CHANGED', 'gear');
        case 'wipe-code-removed':
            return success(render, notification, 'TOAST_WIPE_CODE_REMOVED', 'gear');
        case 'device-wiped':
            return success(render, notification, 'TOAST_DEVICE_WIPED', 'gear');
        case 'copy-to-clipboard':
            return success(render, notification, 'TOAST_COPY_TO_CLIPBOARD');
        case 'raw-tx-sent':
            return success(render, notification, 'TOAST_RAW_TX_SENT', 'arrowUp', {
                txid: notification.txid,
            });
        case 'cardano-delegate-error':
            return error(render, notification, 'TR_ERROR_CARDANO_DELEGATE');
        case 'cardano-withdrawal-error':
            return error(render, notification, 'TR_ERROR_CARDANO_WITHDRAWAL');
        case 'sign-tx-error':
            return error(render, notification, 'TOAST_SIGN_TX_ERROR');
        case 'verify-address-error':
            return error(render, notification, 'TOAST_VERIFY_ADDRESS_ERROR');
        case 'verify-xpub-error':
            return error(render, notification, 'TOAST_VERIFY_XPUB_ERROR');
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
        case 'cannot-open-bluetooth-settings-error':
            return error(
                render,
                notification,
                'TR_BLUETOOTH_CANNOT_OPEN_BLUETOOTH_SETTINGS_REMOVE_DEVICE',
            );
        case 'clear-storage':
            return success(render, notification, 'TR_STORAGE_CLEARED');
        case 'firmware-authenticity-check-error':
            return error(render, notification, notification.translationKey);
        case 'device-authenticity-success':
            return success(render, notification, 'TR_DEVICE_AUTHENTICITY_SUCCESS');
        case 'device-authenticity-error':
            return error(render, notification, 'TR_DEVICE_AUTHENTICITY_ERROR');
        case 'metadata-not-found-error':
            return error(render, notification, 'METADATA_PROVIDER_NOT_FOUND_ERROR');
        case 'metadata-auth-error':
            return error(render, notification, 'METADATA_PROVIDER_AUTH_ERROR');
        case 'metadata-unexpected-error':
            return error(render, notification, 'METADATA_PROVIDER_UNEXPECTED_ERROR');
        case 'estimated-fee-error':
            return info(render, notification, 'TOAST_ESTIMATED_FEE_ERROR');
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
        case 'activate-token-success':
            return success(render, notification, 'TR_ACTIVATE_TOKEN_TOAST_SUCCESS');
        case 'deactivate-token-success':
            return success(render, notification, 'TR_DEACTIVATE_TOKEN_TOAST_SUCCESS');
        case 'auto-eject-settings':
            return <AutoEjectRenderer render={render} notification={notification} />;
        case 'user-feedback-send-success':
            return success(render, notification, 'TR_GUIDE_FEEDBACK_SENT');
        case 'user-feedback-send-error':
            return error(render, notification, 'TR_GUIDE_FEEDBACK_ERROR');
        case 'qr-incorrect-address':
            return error(render, notification, 'TOAST_QR_INCORRECT_ADDRESS');
        case 'qr-incorrect-coin-scheme-protocol':
            return error(render, notification, 'TOAST_QR_INCORRECT_COIN_SCHEME_PROTOCOL', {
                coin: notification.coin,
            });
        case 'qr-unknown-scheme-protocol':
            return error(render, notification, 'TOAST_QR_UNKNOWN_SCHEME_PROTOCOL', {
                scheme: notification.scheme,
                error: notification.error,
            });
        case 'tor-toggle-error':
            return error(render, notification, notification.error);
        case 'tor-is-slow':
            return info(
                render,
                notification,
                'TR_TOR_IS_SLOW_MESSAGE',
                { br: () => <br /> },
                'torBrowser',
            );
        case 'coin-scheme-protocol':
            return <CoinProtocolRenderer render={render} notification={notification} />;
        case 'suite-sync-keys-error':
            return error(render, notification, 'SUITE_SYNC_KEY_RETRIEVAL_FAILED');
        case 'tx-received':
            return (
                <TransactionRenderer
                    render={render}
                    notification={notification}
                    icon="arrowDown"
                    variant="info"
                    message="TOAST_TX_RECEIVED"
                    messageValues={{
                        amount: notification.formattedAmount,
                        account: notification.descriptor,
                    }}
                />
            );
        case 'tx-revoked':
            return (
                <TransactionRenderer
                    render={render}
                    notification={notification}
                    icon="arrowUp"
                    variant="success"
                    message="TOAST_TX_REVOKED"
                    messageValues={{
                        tokenSymbol: notification.tokenSymbol,
                    }}
                />
            );
        case 'tx-approved':
            return (
                <TransactionRenderer
                    render={render}
                    notification={notification}
                    icon="arrowUp"
                    variant="success"
                    message={
                        notification.isInfiniteApproval
                            ? 'TOAST_TX_APPROVED_MAX'
                            : 'TOAST_TX_APPROVED'
                    }
                    messageValues={{
                        amount: notification.formattedAmount,
                        tokenSymbol: notification.tokenSymbol,
                    }}
                />
            );
        case 'tx-exchange': {
            return (
                <ExchangeInfoRenderer
                    render={render}
                    notification={notification}
                    icon="arrowUp"
                    variant="success"
                    message="TOAST_TX_EXCHANGE_BROADCASTED"
                />
            );
        }
        case 'tx-sent':
            return (
                <TransactionRenderer
                    render={render}
                    notification={notification}
                    icon="arrowUp"
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
        case 'coinjoin-interrupted':
            return error(render, notification, 'TR_COINJOIN_INTERRUPTED_ERROR');
        // Events:
        case AUTH_DEVICE:
            return info(render, notification, 'EVENT_WALLET_CREATED');
        case DEVICE.CONNECT:
            return (
                <ActionRenderer
                    render={render}
                    notification={notification}
                    variant="info"
                    message="EVENT_DEVICE_CONNECT"
                    messageValues={{
                        label: deviceLabel,
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
                        label: <Translation id="TR_UNACQUIRED" />,
                    }}
                />
            );
        case 'tx-staked':
            return (
                <TransactionRenderer
                    render={render}
                    notification={notification}
                    icon="arrowUp"
                    variant="success"
                    message="TOAST_TX_STAKED"
                    messageValues={{
                        amount: notification.formattedAmount,
                        account: notification.descriptor,
                    }}
                />
            );
        case 'tx-unstaked':
            return (
                <TransactionRenderer
                    render={render}
                    notification={notification}
                    icon="arrowUp"
                    variant="success"
                    message="TOAST_TX_UNSTAKED"
                    messageValues={{
                        amount: notification.formattedAmount,
                    }}
                />
            );
        case 'tx-claimed':
            return (
                <TransactionRenderer
                    render={render}
                    notification={notification}
                    icon="arrowUp"
                    variant="success"
                    message="TOAST_TX_CLAIMED"
                    messageValues={{
                        amount: notification.formattedAmount,
                    }}
                />
            );
        case 'successful-claim':
            return success(render, notification, 'TOAST_SUCCESSFUL_CLAIM', 'check', {
                networkDisplaySymbol: getNetworkDisplaySymbol(notification.symbol),
            });
        case 'firmware-language-changed':
            return success(render, notification, 'TR_FIRMWARE_LANGUAGE_CHANGED');
        case 'firmware-language-fetch-error':
            return error(render, notification, 'TR_FIRMWARE_LANGUAGE_FETCH_ERROR');
        case 'not-enough-funds-error':
            return error(render, notification, 'TR_NOT_ENOUGH_FUNDS');
        case 'could-not-parse-csv':
            return error(render, notification, 'TR_COULD_NOT_PARSE');
        case 'thp-credentials-reset':
            return success(render, notification, 'TR_THP_RESET_CREDENTIALS_SUCCESS');
        case 'sign-transaction-timeout':
            return error(render, notification, 'TR_SIGN_TRANSACTION_TIMEOUT');
        case 'connect-popup-success':
            return success(render, notification, 'TR_CONNECT_POPUP_SUCCESS', 'check', {
                appName: notification.appName,
            });
        default:
            return exhaustive(type);
    }
};
