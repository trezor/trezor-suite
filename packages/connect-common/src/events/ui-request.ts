/*
 * messages to UI that require a UI_RESPONSE
 */
import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { createTypeGuardByType } from '@trezor/type-utils';

import type { DeviceThpPairingPayload } from './device';
import type { DiscoveryAccount, DiscoveryAccountType } from '../types/account';
import type { BitcoinNetworkInfo, CoinInfo } from '../types/coinInfo';
import type { Device } from '../types/device';
import type { FeeLevel } from '../types/fees';
import { type MessageFactoryFn } from '../types/utils';

export const UI_REQUEST = 'UI_REQUEST';
export const UI_REQUESTS = {
    REQUEST_CONFIRMATION: 'ui-request_confirmation', // -> RECEIVE_CONFIRMATION
    REQUEST_PIN: 'ui-request_pin', // -> RECEIVE_PIN
    REQUEST_PASSPHRASE: 'ui-request_passphrase', // -> RECEIVE_PASSPHRASE
    REQUEST_THP_PAIRING_TAG: 'ui-request_thp_pairing_tag', // -> RECEIVE_THP_PAIRING_TAG
    REQUEST_ACCOUNT: 'ui-request_account', // -> RECEIVE_ACCOUNT
    REQUEST_FEE: 'ui-request_fee', // -> RECEIVE_FEE
    REQUEST_WORD: 'ui-request_word', // -> RECEIVE_WORD
    REQUEST_DISCOVERY_ACCOUNTS: 'ui-request_discovery_accounts', // -> RECEIVE_DISCOVERY_ACCOUNTS
} as const;

export type UiRequestDeviceAction =
    | {
          type: typeof UI_REQUESTS.REQUEST_PIN;
          payload: {
              device: Device;
              type?: PROTO.PinMatrixRequestType;
          };
      }
    | {
          type: typeof UI_REQUESTS.REQUEST_WORD;
          payload: {
              device: Device;
              type: PROTO.WordRequestType;
          };
      }
    | {
          type: typeof UI_REQUESTS.REQUEST_PASSPHRASE;
          payload: {
              device: Device;
              type?: never;
          };
      };

export interface UiRequestThpPairing {
    type: typeof UI_REQUESTS.REQUEST_THP_PAIRING_TAG;
    payload: DeviceThpPairingPayload & {
        device: Device;
    };
}

export interface UiRequestConfirmation {
    type: typeof UI_REQUESTS.REQUEST_CONFIRMATION;
    payload: {
        view:
            | 'thp-pairing-start'
            | 'thp-pairing-failed'
            | 'no-backup'
            | 'export-xpub'
            | 'export-address'
            | 'export-account-info'
            | 'device-management';
        label?: string;
        customConfirmButton?: {
            className: string;
            label: string;
        };
        customCancelButton?: {
            className: string;
            label: string;
        };
    };
}

export interface UiRequestSelectAccount {
    type: typeof UI_REQUESTS.REQUEST_ACCOUNT;
    payload:
        | {
              type: 'start' | 'progress' | 'end';
              coinInfo: CoinInfo;
              accountTypes?: DiscoveryAccountType[];
              defaultAccountType?: DiscoveryAccountType;
              accounts?: DiscoveryAccount[];
              preventEmpty?: boolean;
          }
        | {
              type: 'complete';
              coinInfo: CoinInfo;
              accountTypes: DiscoveryAccountType[];
              defaultAccountType?: DiscoveryAccountType;
              accounts: DiscoveryAccount[];
          };
}

export interface UiRequestSelectFee {
    type: typeof UI_REQUESTS.REQUEST_FEE;
    payload: {
        coinInfo: BitcoinNetworkInfo;
        feeLevels: FeeLevel[];
    };
}

export interface UiRequestDiscoveryAccounts {
    type: typeof UI_REQUESTS.REQUEST_DISCOVERY_ACCOUNTS;
    payload: {
        coinInfo: CoinInfo;
    };
}

export type UiRequestEvent =
    | UiRequestDeviceAction
    | UiRequestConfirmation
    | UiRequestSelectAccount
    | UiRequestSelectFee
    | UiRequestThpPairing
    | UiRequestDiscoveryAccounts;

export const isUiRequestOfType = createTypeGuardByType<UiRequestEvent>();

export type UiRequestMessage = UiRequestEvent & {
    event: typeof UI_REQUEST;
    requestId?: string;
    callId?: string;
};

export const createUiRequestMessage = ((
    type: UiRequestEvent['type'],
    payload?: UiRequestEvent extends { payload: infer P } ? P : undefined,
    options?: { requestId?: string; callId?: string },
) => {
    const { requestId, callId } = options ?? {};

    return {
        event: UI_REQUEST,
        type,
        payload,
        requestId,
        callId,
    };
}) as MessageFactoryFn<typeof UI_REQUEST, UiRequestEvent>;
