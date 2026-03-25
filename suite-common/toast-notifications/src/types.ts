import { type CSSProperties } from 'react';

import { type DesktopAppUpdateState, type Protocol } from '@suite-common/suite-constants';
import { type TrezorDevice } from '@suite-common/suite-types';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type FormStateTradingExchange } from '@suite-common/wallet-types';
import { type DEVICE, type TokenInfo } from '@trezor/connect';

export type UnknownTranslationKey = string;

export type NotificationId = number;

export interface NotificationOptions {
    seen?: boolean;
    resolved?: boolean;
    autoClose?: number | false;
    style?: CSSProperties;
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
    token?: TokenInfo;
} & TransactionNotificationPayload;

type RevokeTransactionNotification = {
    type: 'tx-revoked';
    token: TokenInfo;
} & TransactionNotificationPayload;

type ApproveTransactionNotification = {
    type: 'tx-approved';
    token: TokenInfo;
    isInfiniteApproval: boolean;
} & TransactionNotificationPayload;

type ExchangeTransactionNotification = {
    type: 'tx-exchange';
    metadata: FormStateTradingExchange;
} & TransactionNotificationPayload;

type ReceivedTransactionNotification = {
    type: 'tx-received' | 'tx-confirmed';
    token?: Pick<TokenInfo, 'contract' | 'name' | 'symbol'>;
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

type YieldSupplyTransactionNotification = {
    type: 'tx-yield-supply';
} & TransactionNotificationPayload;

type YieldWithdrawTransactionNotification = {
    type: 'tx-yield-withdraw';
} & TransactionNotificationPayload;

type YieldClaimTransactionNotification = {
    type: 'tx-yield-claim';
} & TransactionNotificationPayload;

export type ErrorToastPayload = {
    type:
        | 'error'
        | 'discovery-error'
        | 'verify-address-error'
        | 'verify-xpub-error'
        | 'sign-message-error'
        | 'verify-message-error'
        | 'sign-tx-error'
        | 'metadata-auth-error'
        | 'metadata-not-found-error'
        | 'metadata-unexpected-error'
        | 'device-authenticity-error'
        | 'cardano-delegate-error'
        | 'cardano-withdrawal-error';
    error: string;
};

export type ToastPayload<TranslationKey extends UnknownTranslationKey = UnknownTranslationKey> = (
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
              | 'device-forgotten'
              | 'backup-success'
              | 'backup-failed'
              | 'sign-message-success'
              | 'verify-message-success'
              | 'device-authenticity-success'
              | 'clear-storage'
              | 'add-token-success'
              | 'activate-token-success'
              | 'deactivate-token-success'
              | 'auto-updater-no-new'
              | 'auto-eject-settings'
              | 'qr-incorrect-address'
              | 'copy-to-clipboard'
              | 'tor-is-slow'
              | 'coinjoin-interrupted'
              | 'firmware-language-changed'
              | 'firmware-language-fetch-error'
              | 'estimated-fee-error'
              | 'not-enough-funds-error'
              | 'could-not-parse-csv'
              | 'thp-credentials-reset'
              | 'sign-transaction-timeout'
              | 'suite-sync-keys-error'
              | 'bip-329-labels-imported';
      }
    | {
          type: 'legacy-labeling-migration-success';
          added: number;
          skipped: number;
      }
    | SentTransactionNotification
    | ApproveTransactionNotification
    | RevokeTransactionNotification
    | ExchangeTransactionNotification
    | {
          type: 'raw-tx-sent';
          txid: string;
      }
    | ErrorToastPayload
    | {
          type: 'auto-updater-error';
          state: DesktopAppUpdateState;
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
          type: 'qr-unknown-scheme-protocol';
          scheme: string;
          error: string;
      }
    | {
          type: 'coin-scheme-protocol';
          scheme: Protocol;
          address: string;
          amount?: number;
      }
    | {
          type: 'suite-sync-keys-error';
      }
    | {
          type: 'tor-toggle-error';
          error: TranslationKey;
      }
    | {
          type: 'firmware-authenticity-check-error';
          translationKey: TranslationKey;
      }
    | {
          type: 'successful-claim';
          symbol: NetworkSymbol;
      }
    | StakedTransactionNotification
    | UnstakedTransactionNotification
    | ClaimedTransactionNotification
    | YieldSupplyTransactionNotification
    | YieldWithdrawTransactionNotification
    | YieldClaimTransactionNotification
    | {
          type: 'cannot-open-bluetooth-settings-error';
      }
    | {
          type: 'connect-popup-success';
          appName: string;
      }
) &
    NotificationOptions;

export const AUTH_DEVICE = 'auth-device';
export type NotificationEventPayload = (
    | {
          type: typeof AUTH_DEVICE;
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

export type ToastNotification<
    TranslationKey extends UnknownTranslationKey = UnknownTranslationKey,
> = {
    context: 'toast';
} & CommonNotificationPayload &
    ToastPayload<TranslationKey>;
export type EventNotification = { context: 'event' } & CommonNotificationPayload &
    NotificationEventPayload;

export type NotificationEntry<TranslationKey extends string = UnknownTranslationKey> =
    | ToastNotification<TranslationKey>
    | EventNotification;

export type AddNotificationAction<TranslationKey extends string = UnknownTranslationKey> = {
    payload: NotificationEntry<TranslationKey>;
};

export type NotificationsState<TranslationKey extends string = UnknownTranslationKey> =
    NotificationEntry<TranslationKey>[];

export type NotificationsRootState<TranslationKey extends string = UnknownTranslationKey> = {
    notifications: NotificationsState<TranslationKey>;
};

export type TransactionNotification = (
    | SentTransactionNotification
    | ReceivedTransactionNotification
) &
    CommonNotificationPayload;

export type TransactionNotificationType = TransactionNotification['type'];
