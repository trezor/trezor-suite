import type { ThpPairingMethod } from '@trezor/protocol';

import { type UI_EVENT } from './ui-request';
import type { DiscoveryAccount } from '../types/account';
import type { LocalFirmwares } from '../types/settings';

/*
 * messages from UI sent by popup or using .uiResponse method
 */

export const UI_RESPONSE = {
    RECEIVE_CONFIRMATION: 'ui-receive_confirmation',
    RECEIVE_FIRMWARE: 'ui-receive_firmware',
    RECEIVE_PIN: 'ui-receive_pin',
    RECEIVE_PASSPHRASE: 'ui-receive_passphrase',
    RECEIVE_THP_PAIRING_TAG: 'ui-receive_thp_pairing_tag',
    RECEIVE_ACCOUNT: 'ui-receive_account',
    RECEIVE_FEE: 'ui-receive_fee',
    RECEIVE_WORD: 'ui-receive_word',
    RECEIVE_DISCOVERY_ACCOUNTS: 'ui-receive_discovery_accounts',
} as const;

export interface UiResponseConfirmation {
    type: typeof UI_RESPONSE.RECEIVE_CONFIRMATION;
    payload: boolean;
}

export interface UiResponseFirmwares {
    type: typeof UI_RESPONSE.RECEIVE_FIRMWARE;
    payload: LocalFirmwares;
}

export interface UiResponsePin {
    type: typeof UI_RESPONSE.RECEIVE_PIN;
    payload: string;
}

export interface UiResponseWord {
    type: typeof UI_RESPONSE.RECEIVE_WORD;
    payload: string;
}

export interface UiResponsePassphrase {
    type: typeof UI_RESPONSE.RECEIVE_PASSPHRASE;
    payload: {
        value: string;
        passphraseOnDevice?: boolean;
        save?: boolean;
    };
    requestId?: string;
}

export interface UiResponseThpPairingTag {
    type: typeof UI_RESPONSE.RECEIVE_THP_PAIRING_TAG;
    payload:
        | {
              tag: string;
          }
        | {
              selectedMethod: ThpPairingMethod | keyof typeof ThpPairingMethod;
          };
}

export interface UiResponseAccount {
    type: typeof UI_RESPONSE.RECEIVE_ACCOUNT;
    payload: number;
}

export interface UiResponseFee {
    type: typeof UI_RESPONSE.RECEIVE_FEE;
    payload:
        | {
              type: 'compose-custom';
              value: string;
          }
        | {
              type: 'change-account';
          }
        | {
              type: 'send';
              value: string;
          };
}

export interface UiResponseDiscoveryAccounts {
    type: typeof UI_RESPONSE.RECEIVE_DISCOVERY_ACCOUNTS;
    payload: { accounts: DiscoveryAccount[] } | null;
}

export type UiResponseEvent =
    | UiResponseConfirmation
    | UiResponsePin
    | UiResponseWord
    | UiResponsePassphrase
    | UiResponseThpPairingTag
    | UiResponseAccount
    | UiResponseFee
    | UiResponseFirmwares
    | UiResponseDiscoveryAccounts
    | UiResponseFirmwares;

export type UiResponseMessage = UiResponseEvent & { event: typeof UI_EVENT; requestId?: string };
