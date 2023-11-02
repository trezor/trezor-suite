// origin: https://github.com/trezor/connect/blob/develop/src/js/popup/view/pin.js

import { UI, createUiResponse, UiRequestDeviceAction } from '@trezor/connect';
import { container, showView, postMessage } from './common';

const isSubmitButtonDisabled = (isDisabled: boolean) => {
    const submitButton = container.getElementsByClassName('submit')[0];
    if (isDisabled) {
        submitButton.setAttribute('disabled', 'disabled');
    } else {
        submitButton.removeAttribute('disabled');
    }
};

const submit = () => {
    const button = container.getElementsByClassName('submit')[0] as HTMLButtonElement;
    button.click();
};

const addPin = (val: number) => {
    const input = container.getElementsByClassName('pin-input')[0] as HTMLInputElement;
    const maxInputLength = 50;

    if (input.value.length < maxInputLength) {
        input.value += val;

        if (input.value.length > 0) {
            isSubmitButtonDisabled(false);
        }
    }
};

const backspacePin = () => {
    const input = container.getElementsByClassName('pin-input')[0] as HTMLInputElement;
    const pin = input.value;

    input.value = pin.substring(0, pin.length - 1);

    if (!input.value) {
        isSubmitButtonDisabled(true);
    }
};

const pinKeyboardHandler = (event: KeyboardEvent) => {
    event.preventDefault();
    switch (event.keyCode) {
        case 13:
            // enter,
            submit();
            break;
        // backspace
        case 8:
            backspacePin();
            break;

        // numeric and numpad
        case 49:
        case 97:
            addPin(1);
            break;
        case 50:
        case 98:
            addPin(2);
            break;
        case 51:
        case 99:
            addPin(3);
            break;
        case 52:
        case 100:
            addPin(4);
            break;
        case 53:
        case 101:
            addPin(5);
            break;
        case 54:
        case 102:
            addPin(6);
            break;
        case 55:
        case 103:
            addPin(7);
            break;
        case 56:
        case 104:
            addPin(8);
            break;
        case 57:
        case 105:
            addPin(9);
            break;
        // no default
    }
};

export const initPinView = (payload: UiRequestDeviceAction['payload']) => {
    showView('pin');

    const deviceName = container.getElementsByClassName('device-name')[0] as HTMLElement;
    const input = container.getElementsByClassName('pin-input')[0] as HTMLInputElement;
    const enter = container.getElementsByClassName('submit')[0];
    const backspace = container.getElementsByClassName('pin-backspace')[0];
    const buttons = container.querySelectorAll<HTMLElement>('[data-value]');

    deviceName.innerText = payload.device.label;

    for (let i = 0; i < buttons.length; i++) {
        buttons.item(i).addEventListener('click', event => {
            if (event.target instanceof HTMLElement) {
                const val = event.target.getAttribute('data-value');
                if (val) {
                    addPin(+val);
                }
            }
        });
    }

    backspace.addEventListener('click', backspacePin);

    enter.addEventListener('click', () => {
        if (input.value.length > 0) {
            window.removeEventListener('keydown', pinKeyboardHandler, false);

            showView('loader');
            postMessage(createUiResponse(UI.RECEIVE_PIN, input.value));
        }
    });

    window.addEventListener('keydown', pinKeyboardHandler, false);
};
