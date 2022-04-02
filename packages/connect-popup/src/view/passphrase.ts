// origin: https://github.com/trezor/connect/blob/develop/src/js/popup/view/passphrase.js

import { UI, UiResponse, UiRequestDeviceAction } from '@trezor/connect';
import { container, showView, postMessage } from './common';

export const initPassphraseView = (payload: UiRequestDeviceAction['payload']) => {
    showView('passphrase');

    const view = container.getElementsByClassName('passphrase')[0];
    const deviceNameSpan = container.getElementsByClassName('device-name')[0] as HTMLElement;
    const input1 = container.getElementsByClassName('pass')[0] as HTMLInputElement;
    const input2 = container.getElementsByClassName('pass-check')[0] as HTMLInputElement;
    const toggle = container.getElementsByClassName('show-passphrase')[0] as HTMLInputElement;
    const enter = container.getElementsByClassName('submit')[0] as HTMLButtonElement;

    let inputType = 'password';

    const { label, features } = payload.device;
    deviceNameSpan.innerText = label;
    const passphraseOnDevice =
        features &&
        features.capabilities &&
        features.capabilities.includes('Capability_PassphraseEntry');

    /* Functions */
    const validation = () => {
        if (input1.value !== input2.value) {
            enter.disabled = true;
            view.classList.add('not-valid');
        } else {
            enter.disabled = false;
            view.classList.remove('not-valid');
        }
    };
    const toggleInputFontStyle = (input: HTMLInputElement) => {
        if (inputType === 'text') {
            // input.classList.add('text');
            input.setAttribute('type', 'text');

            // Since passphrase is visible there's no need to force user to fill the passphrase twice
            // - disable input2
            // - write automatically into input2 as the user is writing into input1 (listen to input event)
            input2.disabled = true;
            input2.value = input1.value;
            validation();
        } else if (inputType === 'password') {
            // input.classList.remove('text');
            input.setAttribute('type', 'password');

            input2.disabled = false;
            input2.value = '';
            validation();
        }
    };
    const handleToggleClick = () => {
        inputType = inputType === 'text' ? 'password' : 'text';

        toggleInputFontStyle(input1);
        toggleInputFontStyle(input2);
    };
    const handleWindowKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            enter.click();
        }
    };
    const handleEnterClick = () => {
        input1.blur();
        input2.blur();
        window.removeEventListener('keydown', handleWindowKeydown);

        showView('loader');
        postMessage(
            UiResponse(UI.RECEIVE_PASSPHRASE, {
                value: input1.value,
                save: true,
            }),
        );
    };

    /* Functions: END */
    input1.addEventListener(
        'input',
        () => {
            validation();
            if (inputType === 'text') {
                input2.value = input1.value;
                validation();
            }
        },
        false,
    );
    input2.addEventListener('input', validation, false);

    toggle.addEventListener('click', handleToggleClick);
    enter.addEventListener('click', handleEnterClick);
    window.addEventListener('keydown', handleWindowKeydown, false);

    if (passphraseOnDevice) {
        const onDevice = container.getElementsByClassName(
            'passphraseOnDevice',
        )[0] as HTMLButtonElement;
        onDevice.style.display = 'block';
        onDevice.addEventListener('click', () => {
            window.removeEventListener('keydown', handleWindowKeydown);
            showView('loader');
            postMessage(
                UiResponse(UI.RECEIVE_PASSPHRASE, {
                    value: '',
                    passphraseOnDevice: true,
                    save: true,
                }),
            );
        });
    }

    input1.focus();
};
