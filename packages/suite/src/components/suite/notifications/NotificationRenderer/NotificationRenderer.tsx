import { type ComponentType, type JSX } from 'react';
import { useSelector } from 'react-redux';

import { type ExtendedMessageDescriptor, Translation, type TranslationKey } from '@suite/intl';
import { selectSelectedDeviceLabelOrName } from '@suite-common/device';
import { AUTH_DEVICE, type NotificationEntry } from '@suite-common/toast-notifications';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { DEVICE } from '@trezor/connect';
import { exhaustive } from '@trezor/type-utils';

import { ActionRenderer } from './ActionRenderer';
import { AutoEjectRenderer } from './AutoEjectRenderer';
import { CoinProtocolRenderer } from './CoinProtocolRenderer';
import { ExchangeInfoRenderer } from './ExchangeInfoRenderer';
import { TransactionRenderer } from './TransactionRenderer';
import { type NotificationViewProps } from '../Notifications/NotificationGroup/NotificationList/NotificationView';

type LocalizedNotificationEntry = NotificationEntry<TranslationKey>;

export type NotificationRendererProps<
    T extends LocalizedNotificationEntry['type'] = LocalizedNotificationEntry['type'],
> = {
    render: ComponentType<{ onCancel?: () => void } & NotificationViewProps>;
    notification: Extract<LocalizedNotificationEntry, { type: T }>;
};

type RenderConfig = {
    variant: NotificationViewProps['variant'];
    message: ExtendedMessageDescriptor['id'];
    values?: ExtendedMessageDescriptor['values'];
    icon?: NotificationViewProps['icon'];
};

/**
 * Renders a notification with the provided configuration.
 *
 * Abstracts common notification rendering logic by accepting a View component,
 * a notification instance, and render configuration (variant, message, icon, etc).
 * Generic over the notification type to ensure type-safe access to notification properties.
 *
 * @param View - React component for displaying the notification (currenty: ToastNotificationView, NotificationView)
 * @param notification - Notification instance with specific type and data
 * @param config - Notification configuration (variant, message ID, translation values, icon)
 * @returns JSX element of the notification
 */
const renderNotificationView = <T extends NotificationEntry['type']>(
    View: NotificationRendererProps<T>['render'],
    notification: NotificationRendererProps<T>['notification'],
    { variant, message, values, icon }: RenderConfig,
) => (
    <View
        notification={notification}
        variant={variant}
        icon={icon}
        message={message}
        messageValues={values}
    />
);

export const NotificationRenderer = ({
    notification,
    render,
}: NotificationRendererProps): JSX.Element => {
    const deviceLabel = useSelector(selectSelectedDeviceLabelOrName);

    const { type } = notification;

    switch (type) {
        case 'acquire-error':
            return renderNotificationView(render, notification, {
                variant: 'error',
                message: 'TOAST_ACQUIRE_ERROR',
                values: { error: notification.error },
            });

        case 'auth-confirm-error':
            return renderNotificationView(render, notification, {
                variant: 'error',
                message: 'TOAST_AUTH_CONFIRM_ERROR',
                values: {
                    error: notification.error || (
                        <Translation id="TOAST_AUTH_CONFIRM_ERROR_DEFAULT" />
                    ),
                },
            });

        case 'discovery-error':
            return renderNotificationView(render, notification, {
                variant: 'error',
                message: 'TOAST_DISCOVERY_ERROR',
                values: { error: notification.error },
            });

        case 'backup-failed':
            return renderNotificationView(render, notification, {
                variant: 'error',
                message: 'TOAST_BACKUP_FAILED',
                values: { error: notification.error },
            });

        case 'backup-success':
            return renderNotificationView(render, notification, {
                variant: 'success',
                message: 'TOAST_BACKUP_SUCCESS',
                icon: 'gear',
            });

        case 'settings-applied':
            return renderNotificationView(render, notification, {
                variant: 'success',
                message: 'TOAST_SETTINGS_APPLIED',
                icon: 'gear',
            });

        case 'pin-changed':
            return renderNotificationView(render, notification, {
                variant: 'success',
                message: 'TOAST_PIN_CHANGED',
                icon: 'gear',
            });

        case 'wipe-code-changed':
            return renderNotificationView(render, notification, {
                variant: 'success',
                message: 'TOAST_WIPE_CODE_CHANGED',
                icon: 'gear',
            });

        case 'wipe-code-removed':
            return renderNotificationView(render, notification, {
                variant: 'success',
                message: 'TOAST_WIPE_CODE_REMOVED',
                icon: 'gear',
            });

        case 'device-wiped':
            return renderNotificationView(render, notification, {
                variant: 'success',
                message: 'TOAST_DEVICE_WIPED',
                icon: 'gear',
            });

        case 'device-forgotten':
            return renderNotificationView(render, notification, {
                variant: 'success',
                message: 'TR_DEVICE_HAS_BEEN_FORGOTTEN',
                icon: 'check',
            });

        case 'copy-to-clipboard':
            return renderNotificationView(render, notification, {
                variant: 'success',
                message: 'TOAST_COPY_TO_CLIPBOARD',
            });

        case 'raw-tx-sent':
            return renderNotificationView(render, notification, {
                variant: 'success',
                message: 'TOAST_RAW_TX_SENT',
                icon: 'arrowUp',
                values: { txid: notification.txid },
            });

        case 'cardano-delegate-error':
            return renderNotificationView(render, notification, {
                variant: 'error',
                message: 'TR_ERROR_CARDANO_DELEGATE',
                values: { error: notification.error },
            });

        case 'cardano-withdrawal-error':
            return renderNotificationView(render, notification, {
                variant: 'error',
                message: 'TR_ERROR_CARDANO_WITHDRAWAL',
                values: { error: notification.error },
            });

        case 'sign-tx-error':
            return renderNotificationView(render, notification, {
                variant: 'error',
                message: 'TOAST_SIGN_TX_ERROR',
                values: { error: notification.error },
            });

        case 'verify-address-error':
            return renderNotificationView(render, notification, {
                variant: 'error',
                message: 'TOAST_VERIFY_ADDRESS_ERROR',
                values: { error: notification.error },
            });

        case 'verify-xpub-error':
            return renderNotificationView(render, notification, {
                variant: 'error',
                message: 'TOAST_VERIFY_XPUB_ERROR',
                values: { error: notification.error },
            });

        case 'sign-message-error':
            return renderNotificationView(render, notification, {
                variant: 'error',
                message: 'TOAST_SIGN_MESSAGE_ERROR',
                values: { error: notification.error },
            });

        case 'verify-message-error':
            return renderNotificationView(render, notification, {
                variant: 'error',
                message: 'TOAST_VERIFY_MESSAGE_ERROR',
                values: { error: notification.error },
            });

        case 'sign-message-success':
            return renderNotificationView(render, notification, {
                variant: 'success',
                message: 'TOAST_SIGN_MESSAGE_SUCCESS',
            });

        case 'verify-message-success':
            return renderNotificationView(render, notification, {
                variant: 'success',
                message: 'TOAST_VERIFY_MESSAGE_SUCCESS',
            });

        case 'error':
            return renderNotificationView(render, notification, {
                variant: 'error',
                message: 'TOAST_GENERIC_ERROR',
                values: { error: notification.error },
            });

        case 'cannot-open-bluetooth-settings-error':
            return renderNotificationView(render, notification, {
                variant: 'error',
                message: 'TR_BLUETOOTH_CANNOT_OPEN_BLUETOOTH_SETTINGS_REMOVE_DEVICE',
                values: { error: notification.error },
            });

        case 'clear-storage':
            return renderNotificationView(render, notification, {
                variant: 'success',
                message: 'TR_STORAGE_CLEARED',
            });

        case 'firmware-authenticity-check-error':
            return renderNotificationView(render, notification, {
                variant: 'error',
                message: notification.translationKey,
                values: { error: notification.error },
            });

        case 'device-authenticity-success':
            return renderNotificationView(render, notification, {
                variant: 'success',
                message: 'TR_DEVICE_AUTHENTICITY_SUCCESS',
            });

        case 'device-authenticity-error':
            return renderNotificationView(render, notification, {
                variant: 'error',
                message: 'TR_DEVICE_AUTHENTICITY_ERROR',
                values: { error: notification.error },
            });

        case 'metadata-not-found-error':
            return renderNotificationView(render, notification, {
                variant: 'error',
                message: 'METADATA_PROVIDER_NOT_FOUND_ERROR',
                values: { error: notification.error },
            });

        case 'metadata-auth-error':
            return renderNotificationView(render, notification, {
                variant: 'error',
                message: 'METADATA_PROVIDER_AUTH_ERROR',
                values: { error: notification.error },
            });

        case 'metadata-unexpected-error':
            return renderNotificationView(render, notification, {
                variant: 'error',
                message: 'METADATA_PROVIDER_UNEXPECTED_ERROR',
                values: { error: notification.error },
            });

        case 'estimated-fee-error':
            return renderNotificationView(render, notification, {
                variant: 'info',
                message: 'TOAST_ESTIMATED_FEE_ERROR',
            });

        case 'auto-updater-error':
            return renderNotificationView(render, notification, {
                variant: 'error',
                message: 'TOAST_AUTO_UPDATER_ERROR',
                values: { state: notification.state },
            });

        case 'auto-updater-no-new':
            return renderNotificationView(render, notification, {
                variant: 'info',
                message: 'TOAST_AUTO_UPDATER_NO_NEW',
            });

        case 'auto-updater-new-version-first-run':
            return renderNotificationView(render, notification, {
                variant: 'info',
                message: 'TOAST_AUTO_UPDATER_NEW_VERSION_FIRST_RUN',
                values: { version: notification.version },
            });

        case 'add-token-success':
            return renderNotificationView(render, notification, {
                variant: 'success',
                message: 'TR_ADD_TOKEN_TOAST_SUCCESS',
            });

        case 'activate-token-success':
            return renderNotificationView(render, notification, {
                variant: 'success',
                message: 'TR_ACTIVATE_TOKEN_TOAST_SUCCESS',
            });

        case 'deactivate-token-success':
            return renderNotificationView(render, notification, {
                variant: 'success',
                message: 'TR_DEACTIVATE_TOKEN_TOAST_SUCCESS',
            });

        case 'auto-eject-settings':
            return <AutoEjectRenderer render={render} notification={notification} />;

        case 'user-feedback-send-success':
            return renderNotificationView(render, notification, {
                variant: 'success',
                message: 'TR_GUIDE_FEEDBACK_SENT',
            });

        case 'user-feedback-send-error':
            return renderNotificationView(render, notification, {
                variant: 'error',
                message: 'TR_GUIDE_FEEDBACK_ERROR',
                values: { error: notification.error },
            });

        case 'qr-incorrect-address':
            return renderNotificationView(render, notification, {
                variant: 'error',
                message: 'TOAST_QR_INCORRECT_ADDRESS',
                values: { error: notification.error },
            });

        case 'qr-incorrect-coin-scheme-protocol':
            return renderNotificationView(render, notification, {
                variant: 'error',
                message: 'TOAST_QR_INCORRECT_COIN_SCHEME_PROTOCOL',
                values: { coin: notification.coin },
            });

        case 'qr-unknown-scheme-protocol':
            return renderNotificationView(render, notification, {
                variant: 'error',
                message: 'TOAST_QR_UNKNOWN_SCHEME_PROTOCOL',
                values: {
                    scheme: notification.scheme,
                    error: notification.error,
                },
            });

        case 'tor-toggle-error':
            return renderNotificationView(render, notification, {
                variant: 'error',
                message: notification.error,
                values: { error: notification.error },
            });

        case 'tor-is-slow':
            return renderNotificationView(render, notification, {
                variant: 'info',
                message: 'TR_TOR_IS_SLOW_MESSAGE',
                icon: 'torBrowser',
                values: { br: () => <br /> },
            });

        case 'coin-scheme-protocol':
            return <CoinProtocolRenderer render={render} notification={notification} />;

        case 'suite-sync-keys-error':
            return renderNotificationView(render, notification, {
                variant: 'error',
                message: 'SUITE_SYNC_KEY_RETRIEVAL_FAILED',
                values: { error: notification.error },
            });

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
                        tokenSymbol: notification.token.symbol,
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
                    message="TOAST_TX_APPROVED"
                    messageValues={{
                        amount: notification.formattedAmount,
                        tokenSymbol: notification.token.symbol,
                    }}
                />
            );

        case 'tx-exchange':
            return (
                <ExchangeInfoRenderer
                    render={render}
                    notification={notification}
                    icon="arrowUp"
                    variant="success"
                    message="TOAST_TX_EXCHANGE_BROADCASTED"
                />
            );

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
            return renderNotificationView(render, notification, {
                variant: 'error',
                message: 'TR_COINJOIN_INTERRUPTED_ERROR',
                values: { error: notification.error },
            });

        // Events:
        case AUTH_DEVICE:
            return renderNotificationView(render, notification, {
                variant: 'info',
                message: 'EVENT_WALLET_CREATED',
            });

        case DEVICE.CONNECT:
            return (
                <ActionRenderer
                    render={render}
                    notification={notification}
                    variant="info"
                    message="EVENT_DEVICE_CONNECT"
                    messageValues={{ label: deviceLabel }}
                />
            );

        case DEVICE.CONNECT_UNACQUIRED:
            return (
                <ActionRenderer
                    render={render}
                    notification={notification}
                    variant="warning"
                    message="EVENT_DEVICE_CONNECT_UNACQUIRED"
                    messageValues={{ label: <Translation id="TR_UNACQUIRED" /> }}
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

        case 'tx-yield-supply':
            return (
                <TransactionRenderer
                    render={render}
                    notification={notification}
                    icon="arrowUp"
                    variant="success"
                    message="TOAST_TX_YIELD_SUPPLY"
                    messageValues={{
                        account: notification.descriptor,
                    }}
                />
            );

        case 'tx-yield-withdraw':
            return (
                <TransactionRenderer
                    render={render}
                    notification={notification}
                    icon="arrowUp"
                    variant="success"
                    message="TOAST_TX_YIELD_WITHDRAW"
                    messageValues={{
                        account: notification.descriptor,
                    }}
                />
            );

        case 'tx-yield-claim':
            return (
                <TransactionRenderer
                    render={render}
                    notification={notification}
                    icon="arrowUp"
                    variant="success"
                    message="TOAST_TX_YIELD_CLAIM"
                    messageValues={{
                        account: notification.descriptor,
                    }}
                />
            );

        case 'successful-claim':
            return renderNotificationView(render, notification, {
                variant: 'success',
                message: 'TOAST_SUCCESSFUL_CLAIM',
                icon: 'check',
                values: {
                    networkDisplaySymbol: getNetworkDisplaySymbol(notification.symbol),
                },
            });

        case 'firmware-language-changed':
            return renderNotificationView(render, notification, {
                variant: 'success',
                message: 'TR_FIRMWARE_LANGUAGE_CHANGED',
            });

        case 'firmware-language-fetch-error':
            return renderNotificationView(render, notification, {
                variant: 'error',
                message: 'TR_FIRMWARE_LANGUAGE_FETCH_ERROR',
                values: { error: notification.error },
            });

        case 'not-enough-funds-error':
            return renderNotificationView(render, notification, {
                variant: 'error',
                message: 'TR_NOT_ENOUGH_FUNDS',
                values: { error: notification.error },
            });

        case 'could-not-parse-csv':
            return renderNotificationView(render, notification, {
                variant: 'error',
                message: 'TR_COULD_NOT_PARSE',
                values: { error: notification.error },
            });

        case 'thp-credentials-reset':
            return renderNotificationView(render, notification, {
                variant: 'success',
                message: 'TR_THP_RESET_CREDENTIALS_SUCCESS',
            });

        case 'sign-transaction-timeout':
            return renderNotificationView(render, notification, {
                variant: 'error',
                message: 'TR_SIGN_TRANSACTION_TIMEOUT',
                values: { error: notification.error },
            });

        case 'connect-popup-success':
            return renderNotificationView(render, notification, {
                variant: 'success',
                message: 'TR_CONNECT_POPUP_SUCCESS',
                icon: 'check',
                values: { appName: notification.appName },
            });

        case 'bip-329-labels-imported':
            return renderNotificationView(render, notification, {
                variant: 'success',
                message: 'TR_BIP_329_LABELS_IMPORTED',
            });

        case 'legacy-labeling-migration-success':
            return renderNotificationView(render, notification, {
                variant: 'success',
                message: 'TR_LABELING_MIGRATION_SUCCESS',
                values: {
                    added: notification.added,
                    skipped: notification.skipped,
                },
            });

        default:
            return exhaustive(type);
    }
};
