/* @flow */
'use strict';

import TrezorConnect, { UI, UI_EVENT } from 'trezor-connect';
import * as ACTIONS from './index';

export function onPinAdd(number: number): any {
    return {
        type: ACTIONS.ON_PIN_ADD,
        number
    }
}

export function onPinBackspace(): any {
    return {
        type: ACTIONS.ON_PIN_BACKSPACE
    }
}

export function onPinSubmit(value: string): void {
    TrezorConnect.uiResponse({ type: UI.RECEIVE_PIN, data: value });
    return {
        type: ACTIONS.CLOSE_MODAL
    }
}

export function onPassphraseChange(value: string): any {
    return {
        type: ACTIONS.ON_PASSPHRASE_CHANGE,
        value
    }
}

export function onPassphraseShow(): any {
    return {
        type: ACTIONS.ON_PASSPHRASE_SHOW
    }
}

export function onPassphraseHide(): any {
    return {
        type: ACTIONS.ON_PASSPHRASE_HIDE
    }
}

export function onPassphraseSave(): any {
    return {
        type: ACTIONS.ON_PASSPHRASE_SAVE
    }
}

export function onPassphraseForget(): any {
    return {
        type: ACTIONS.ON_PASSPHRASE_FORGET
    }
}

export function onPassphraseFocus(): any {
    return {
        type: ACTIONS.ON_PASSPHRASE_FOCUS
    }
}

export function onPassphraseBlur(): any {
    return {
        type: ACTIONS.ON_PASSPHRASE_BLUR
    }
}

export function onPassphraseSubmit(value: string, cache: boolean): void {
    TrezorConnect.uiMessage({ 
        type: UI.RECEIVE_PASSPHRASE, 
        data: {
            value,
            save: cache
        } 
    });
    return {
        type: ACTIONS.CLOSE_MODAL
    }
}

export function onConfirmation(): any {
    //postMessage(new UiMessage(UI.RECEIVE_CONFIRMATION, 'true') );
    TrezorConnect.uiMessage({
        type: UI.RECEIVE_CONFIRMATION,
        data: 'true'
    });
    
    return {
        type: ACTIONS.CLOSE_MODAL
    }
}

export function onConfirmationCancel(): any {
    TrezorConnect.uiMessage({
        type: UI.RECEIVE_CONFIRMATION,
        data: 'false'
    });

    return {
        type: ACTIONS.CLOSE_MODAL
    }
}

export function onPermissionGranted(): any {
    //postMessage(new UiMessage(UI.RECEIVE_CONFIRMATION, 'true') );
    TrezorConnect.uiMessage({
        type: UI.RECEIVE_PERMISSION,
        data: 'true'
    });

    return {
        type: ACTIONS.CLOSE_MODAL
    }
}

export function onPermissionRejected(): any {
    TrezorConnect.uiMessage({
        type: UI.RECEIVE_PERMISSION,
        data: 'false'
    });

    return {
        type: ACTIONS.CLOSE_MODAL
    }
}

export function onAccountSelect(account): any {
    TrezorConnect.uiMessage({
        type: UI.RECEIVE_ACCOUNT,
        data: account + ''
    });

    return {
        type: ACTIONS.CLOSE_MODAL
    }
}

export function onFeeSelect(fee: number): any {
    TrezorConnect.uiMessage({
        type: UI.RECEIVE_FEE,
        data: fee + ':fee'
    });

    return {
        type: ACTIONS.CLOSE_MODAL
    }
}

export function onChangeAccount(): any {
    TrezorConnect.uiMessage({
        type: UI.RECEIVE_FEE,
        data: 'change_account'
    });
    return {
        type: ACTIONS.CLOSE_MODAL
    }
}


export function onCustomFeeOpen(): any {
    return {
        type: ACTIONS.ON_CUSTOM_FEE_OPEN
    }
}

export function onCustomFeeChange(value: number): any {

    TrezorConnect.uiMessage({
        type: UI.RECEIVE_FEE,
        data: value + ':custom'
    });

    return {
        type: ACTIONS.ON_CUSTOM_FEE_CHANGE,
        value
    }
}