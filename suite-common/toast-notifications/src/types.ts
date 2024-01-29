import { TranslationKey } from '@suite-common/intl-types';
import { DesktopAppUpdateState, PROTOCOL_SCHEME } from '@suite-common/suite-constants';
import { TrezorDevice } from '@suite-common/suite-types';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { DEVICE } from '@trezor/connect';

export type NotificationId = number;

export interface NotificationOptions {
    seen?: boolean;
    resolved?: boolean;
    autoClose?: number | false;
}

type TransactionNotificationPayload = {
    formattedAmount: string;
    device?: TrezorDevice;
    descriptor: string;
    symbol: NetworkSymbol;
    txid: string;
};
type SentTransactionNotification = {
    type: 'tx-sent';
} & TransactionNotificationPayload;

type ReceivedTransactionNotification = {
    type: 'tx-received' | 'tx-confirmed';
} & TransactionNotificationPayload;

type StakedTransactionNotification = {
    type: 'tx-staked';
} & TransactionNotificationPayload;

type UnstakedTransactionNotification = {
    type: 'tx-unstaked';
} & TransactionNotificationPayload;

type ClaimedTransactionNotification = {
    type: 'tx-claimed';
} & TransactionNotificationPayload;

export type ToastPayload = (
    | {
          type: 'acquire-error';
          error: string;
          device?: TrezorDevice;
      }
    | {
          type: 'auth-confirm-error';
          error?: string;
      }
    | {
          type:
              | 'settings-applied'
              | 'pin-changed'
              | 'wipe-code-changed'
              | 'wipe-code-removed'
              | 'device-wiped'
              | 'backup-success'
              | 'backup-failed'
              | 'sign-message-success'
              | 'verify-message-success'
              | 'firmware-check-authenticity-success'
              | 'device-authenticity-success';
      }
    | SentTransactionNotification
    | {
          type: 'raw-tx-sent';
          txid: string;
      }
    | {
          type: 'copy-to-clipboard';
      }
    | {
          type: 'clear-storage';
      }
    | {
          type: 'bridge-dev-restart';
          devMode: boolean;
      }
    | {
          type: 'add-token-success';
      }
    | {
          type:
              | 'error'
              | 'auth-failed'
              | 'discovery-error'
              | 'verify-address-error'
              | 'verify-xpub-error'
              | 'sign-message-error'
              | 'verify-message-error'
              | 'sign-tx-error'
              | 'metadata-auth-error'
              | 'metadata-not-found-error'
              | 'metadata-unexpected-error'
              | 'device-authenticity-error';
          error: string;
      }
    | {
          type: 'auto-updater-error';
          state: DesktopAppUpdateState;
      }
    | {
          type: 'auto-updater-no-new';
      }
    | {
          type: 'auto-updater-new-version-first-run';
          version: string;
      }
    | {
          type: 'user-feedback-send-success' | 'user-feedback-send-error';
      }
    | {
          type: 'qr-incorrect-coin-scheme-protocol';
          coin: string;
      }
    | {
          type: 'qr-incorrect-address';
      }
    | {
          type: 'coin-scheme-protocol';
          scheme: PROTOCOL_SCHEME;
          address: string;
          amount?: number;
      }
    | {
          type: 'cardano-delegate-error';
          error: string;
      }
    | {
          type: 'cardano-withdrawal-error';
          error: string;
      }
    | {
          type: 'savings-kyc-failed';
      }
    | {
          type: 'savings-kyc-success';
      }
    | {
          type: 'tor-toggle-error';
          error: TranslationKey;
      }
    | {
          type: 'tor-is-slow';
      }
    | {
          type: 'coinjoin-interrupted';
      }
    | {
          type: 'successful-claim';
          symbol: string;
      }
    | StakedTransactionNotification
    | UnstakedTransactionNotification
    | ClaimedTransactionNotification
) &
    NotificationOptions;

export type NotificationEventPayload = (
    | {
          // only temporary, must be same as AUTH_DEVICE value in packages/suite/src/actions/suite/constants/suiteConstants.ts
          // once that will be migrated to @suite-common, this should be replaced directly by suiteActions.authDevice.type
          // this should not break type safety, if someone will change value of AUTH_DEVICE, it will throw error in place
          // where action is used and you will need to change it also here
          type: '@suite/device/authDevice';
      }
    | ReceivedTransactionNotification
    | {
          type: typeof DEVICE.CONNECT | typeof DEVICE.CONNECT_UNACQUIRED;
          device: TrezorDevice;
          needAttention?: boolean;
      }
) &
    NotificationOptions;

export interface CommonNotificationPayload {
    id: NotificationId; // programmer provided, might be used to find and close notification programmatically
    device?: TrezorDevice; // used to close notifications for device
    closed?: boolean;
    error?: string;
}

export type ToastNotification = { context: 'toast' } & CommonNotificationPayload & ToastPayload;
export type EventNotification = { context: 'event' } & CommonNotificationPayload &
    NotificationEventPayload;

export type NotificationEntry = ToastNotification | EventNotification;

export type NotificationsState = NotificationEntry[];

export type NotificationsRootState = {
    notifications: NotificationsState;
};

export type TransactionNotification = (
    | SentTransactionNotification
    | ReceivedTransactionNotification
) &
    CommonNotificationPayload;

export type TransactionNotificationType = TransactionNotification['type'];
