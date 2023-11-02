// origin: https://github.com/trezor/connect/blob/develop/src/js/popup/view/word.js

import { UI, createUiResponse, UiRequestDeviceAction } from '@trezor/connect';
import { container, showView, postMessage } from './common';
import { bip39 } from '@trezor/crypto-utils';

const initWordPlainView = (payload: UiRequestDeviceAction['payload']) => {
    showView('word-plain');

    const deviceName = container.getElementsByClassName('device-name')[0] as HTMLElement;
    const datalist = container.getElementsByClassName('bip-words')[0] as HTMLElement;
    const input = container.getElementsByClassName('word-input')[0] as HTMLInputElement;
    deviceName.innerText = payload.device.label;

    const clearWord = () => {
        input.value = '';
        input.focus();
    };

    const submit = () => {
        postMessage(createUiResponse(UI.RECEIVE_WORD, input.value));
        clearWord();
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        window.removeEventListener('keydown', wordKeyboardHandler);
    };

    const wordKeyboardHandler = (event: KeyboardEvent) => {
        switch (event.keyCode) {
            case 13: // enter,
            case 9: // tab
                event.preventDefault();
                submit();
                break;
            // no default
        }
    };

    bip39.forEach(word => {
        const item = document.createElement('option');
        item.value = word;
        datalist.appendChild(item);
    });

    input.focus();

    window.addEventListener('keydown', wordKeyboardHandler, false);
};

const initWordMatrixView = (payload: UiRequestDeviceAction['payload']) => {
    showView('word-matrix');

    const submit = (val: string) => {
        postMessage(createUiResponse(UI.RECEIVE_WORD, val));
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        window.addEventListener('keydown', keyboardHandler, true);
    };

    const keyboardHandler = (event: KeyboardEvent) => {
        event.preventDefault();
        switch (event.keyCode) {
            // numeric and numpad
            case 49:
            case 97:
                submit('1');
                break;
            case 50:
            case 98:
                submit('2');
                break;
            case 51:
            case 99:
                submit('3');
                break;
            case 52:
            case 100:
                submit('4');
                break;
            case 53:
            case 101:
                submit('5');
                break;
            case 54:
            case 102:
                submit('6');
                break;
            case 55:
            case 103:
                submit('7');
                break;
            case 56:
            case 104:
                submit('8');
                break;
            case 57:
            case 105:
                submit('9');
                break;
            // no default
        }
    };

    const deviceName = container.getElementsByClassName('device-name')[0] as HTMLElement;
    const buttons = container.querySelectorAll('[data-value]');
    deviceName.innerText = payload.device.label;

    for (let i = 0; i < buttons.length; i++) {
        buttons.item(i).addEventListener('click', (event: Event) => {
            if (event.target instanceof HTMLElement) {
                const val = event.target.getAttribute('data-value');
                if (val) {
                    submit(val);
                }
            }
        });
    }

    const wordsOnRight = container.getElementsByClassName(
        'word-right',
    ) as HTMLCollectionOf<HTMLElement>;
    const wordsOnRightDisplay = payload.type !== 'WordRequestType_Matrix9' ? 'none' : 'initial';
    for (let i = 0; i < wordsOnRight.length; i++) {
        wordsOnRight[i].style.display = wordsOnRightDisplay;
    }

    window.addEventListener('keydown', keyboardHandler, true);
};

export const initWordView = (payload: UiRequestDeviceAction['payload']) => {
    if (payload.type === 'WordRequestType_Plain') {
        initWordPlainView(payload);
    } else {
        initWordMatrixView(payload);
    }
};
