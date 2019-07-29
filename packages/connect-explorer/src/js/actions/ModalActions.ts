import TrezorConnect, { UI, UI_EVENT } from 'trezor-connect';
import * as ACTIONS from './index';

export type ModalActions =
    | { type: typeof ACTIONS.ON_PIN_ADD; number: number }
    | { type: typeof ACTIONS.ON_PIN_BACKSPACE }
    | { type: typeof ACTIONS.CLOSE_MODAL }
    | { type: typeof ACTIONS.ON_PASSPHRASE_CHANGE; value: string }
    | { type: typeof ACTIONS.ON_PASSPHRASE_SHOW }
    | { type: typeof ACTIONS.ON_PASSPHRASE_HIDE }
    | { type: typeof ACTIONS.ON_PASSPHRASE_SAVE }
    | { type: typeof ACTIONS.ON_PASSPHRASE_FORGET }
    | { type: typeof ACTIONS.ON_PASSPHRASE_FOCUS }
    | { type: typeof ACTIONS.ON_PASSPHRASE_BLUR }
    | { type: typeof ACTIONS.ON_CUSTOM_FEE_OPEN }
    | { type: typeof ACTIONS.ON_CUSTOM_FEE_CHANGE; value: number };

export function onPinAdd(number: number) {
    return {
        type: ACTIONS.ON_PIN_ADD,
        number,
    };
}

export function onPinBackspace() {
    return {
        type: ACTIONS.ON_PIN_BACKSPACE,
    };
}

export function onPinSubmit(value: string) {
    TrezorConnect.uiResponse({ type: UI.RECEIVE_PIN, data: value });
    return {
        type: ACTIONS.CLOSE_MODAL,
    };
}

export function onPassphraseChange(value: string) {
    return {
        type: ACTIONS.ON_PASSPHRASE_CHANGE,
        value,
    };
}

export function onPassphraseShow() {
    return {
        type: ACTIONS.ON_PASSPHRASE_SHOW,
    };
}

export function onPassphraseHide() {
    return {
        type: ACTIONS.ON_PASSPHRASE_HIDE,
    };
}

export function onPassphraseSave() {
    return {
        type: ACTIONS.ON_PASSPHRASE_SAVE,
    };
}

export function onPassphraseForget() {
    return {
        type: ACTIONS.ON_PASSPHRASE_FORGET,
    };
}

export function onPassphraseFocus() {
    return {
        type: ACTIONS.ON_PASSPHRASE_FOCUS,
    };
}

export function onPassphraseBlur() {
    return {
        type: ACTIONS.ON_PASSPHRASE_BLUR,
    };
}

export function onPassphraseSubmit(value: string, cache: boolean): void {
    TrezorConnect.uiMessage({
        type: UI.RECEIVE_PASSPHRASE,
        data: {
            value,
            save: cache,
        },
    });
    return {
        type: ACTIONS.CLOSE_MODAL,
    };
}

export function onConfirmation() {
    // postMessage(new UiMessage(UI.RECEIVE_CONFIRMATION, 'true') );
    TrezorConnect.uiMessage({
        type: UI.RECEIVE_CONFIRMATION,
        data: 'true',
    });

    return {
        type: ACTIONS.CLOSE_MODAL,
    };
}

export function onConfirmationCancel() {
    TrezorConnect.uiMessage({
        type: UI.RECEIVE_CONFIRMATION,
        data: 'false',
    });

    return {
        type: ACTIONS.CLOSE_MODAL,
    };
}

export function onPermissionGranted() {
    // postMessage(new UiMessage(UI.RECEIVE_CONFIRMATION, 'true') );
    TrezorConnect.uiMessage({
        type: UI.RECEIVE_PERMISSION,
        data: 'true',
    });

    return {
        type: ACTIONS.CLOSE_MODAL,
    };
}

export function onPermissionRejected() {
    TrezorConnect.uiMessage({
        type: UI.RECEIVE_PERMISSION,
        data: 'false',
    });

    return {
        type: ACTIONS.CLOSE_MODAL,
    };
}

export function onAccountSelect(account) {
    TrezorConnect.uiMessage({
        type: UI.RECEIVE_ACCOUNT,
        data: `${account}`,
    });

    return {
        type: ACTIONS.CLOSE_MODAL,
    };
}

export function onFeeSelect(fee: number) {
    TrezorConnect.uiMessage({
        type: UI.RECEIVE_FEE,
        data: `${fee}:fee`,
    });

    return {
        type: ACTIONS.CLOSE_MODAL,
    };
}

export function onChangeAccount() {
    TrezorConnect.uiMessage({
        type: UI.RECEIVE_FEE,
        data: 'change_account',
    });
    return {
        type: ACTIONS.CLOSE_MODAL,
    };
}

export function onCustomFeeOpen() {
    return {
        type: ACTIONS.ON_CUSTOM_FEE_OPEN,
    };
}

export function onCustomFeeChange(value: number) {
    TrezorConnect.uiMessage({
        type: UI.RECEIVE_FEE,
        data: `${value}:custom`,
    });

    return {
        type: ACTIONS.ON_CUSTOM_FEE_CHANGE,
        value,
    };
}
