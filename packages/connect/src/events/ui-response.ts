import { POPUP } from './popup';
import { UI_EVENT } from './ui-request';
import type { Device } from '../types/device';
import type { MessageFactoryFn } from '../types/utils';

/*
 * messages from UI sent by popup or using .uiResponse method
 */

export const UI_RESPONSE = {
    RECEIVE_PERMISSION: 'ui-receive_permission',
    RECEIVE_CONFIRMATION: 'ui-receive_confirmation',
    RECEIVE_PIN: 'ui-receive_pin',
    RECEIVE_PASSPHRASE: 'ui-receive_passphrase',
    RECEIVE_DEVICE: 'ui-receive_device',
    RECEIVE_ACCOUNT: 'ui-receive_account',
    RECEIVE_FEE: 'ui-receive_fee',
    RECEIVE_WORD: 'ui-receive_word',
    INVALID_PASSPHRASE_ACTION: 'ui-invalid_passphrase_action',
    CHANGE_SETTINGS: 'ui-change_settings',
    LOGIN_CHALLENGE_RESPONSE: 'ui-login_challenge_response',
    EJECT_DEVICE: 'ui-eject_device',
} as const;

export interface UiResponsePopupHandshake {
    type: typeof POPUP.HANDSHAKE;
    payload?: typeof undefined;
}

export interface UiResponsePermission {
    type: typeof UI_RESPONSE.RECEIVE_PERMISSION;
    payload: {
        granted: boolean;
        remember: boolean;
    };
}

export interface UiResponseConfirmation {
    type: typeof UI_RESPONSE.RECEIVE_CONFIRMATION;
    payload: boolean;
}

export interface UiResponseDevice {
    type: typeof UI_RESPONSE.RECEIVE_DEVICE;
    payload: {
        device: Device;
        remember?: boolean;
    };
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

export interface UiResponsePassphraseAction {
    type: typeof UI_RESPONSE.INVALID_PASSPHRASE_ACTION;
    payload: boolean;
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

export interface UiResponseLoginChallenge {
    type: typeof UI_RESPONSE.LOGIN_CHALLENGE_RESPONSE;
    payload: {
        challengeHidden: string;
        challengeVisual: string;
    };
}

export interface UiResponseEjectDevice {
    type: typeof UI_RESPONSE.EJECT_DEVICE;
    payload: undefined;
}

export type UiResponseEvent =
    | UiResponsePopupHandshake
    | UiResponsePermission
    | UiResponseConfirmation
    | UiResponseDevice
    | UiResponsePin
    | UiResponseWord
    | UiResponsePassphrase
    | UiResponsePassphraseAction
    | UiResponseAccount
    | UiResponseFee
    | UiResponseLoginChallenge
    | UiResponseEjectDevice;

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
