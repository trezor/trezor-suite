import type { ThpPairingMethod } from '@trezor/protocol';

import { UI_EVENT } from './ui-request';
import type { LocalFirmwares } from '../types/settings';
import type { MessageFactoryFn } from '../types/utils';

/*
 * messages from UI sent by popup or using .uiResponse method
 */

export { UI_RESPONSE } from '@trezor/connect-common';

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

export type UiResponseEvent =
    | UiResponseConfirmation
    | UiResponsePin
    | UiResponseWord
    | UiResponsePassphrase
    | UiResponseThpPairingTag
    | UiResponseAccount
    | UiResponseFee
    | UiResponseFirmwares;

export type UiResponseMessage = UiResponseEvent & { event: typeof UI_EVENT };

export const createUiResponse: MessageFactoryFn<typeof UI_EVENT, UiResponseEvent> = (
    type,
    payload,
) =>
    ({
        event: UI_EVENT,
        type,
        payload,
    }) as any;
