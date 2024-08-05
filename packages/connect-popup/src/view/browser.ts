// origin: https://github.com/trezor/connect/blob/develop/src/js/popup/view/browser.js

import { SystemInfo } from '@trezor/connect';
import { storage } from '@trezor/connect-common';
import { container, showView } from './common';

export const initBrowserView = (systemInfo: SystemInfo): Promise<boolean> => {
    if (systemInfo?.os.mobile && !systemInfo?.browser.supported) {
        // popup can now support smartphones that have WebUSB support (e.g. Android with Chrome)
        // browsers that are not supported will get rejected
        showView('smartphones-not-supported');

        return Promise.resolve(false);
    }

    if (systemInfo?.browser.supported) {
        return Promise.resolve(true);
    }

    const permitted = storage.load().browser;
    if (permitted) {
        return Promise.resolve(true);
    }
    showView('browser-not-supported');

    const h3 = container.getElementsByTagName('h3')[0];
    const ackButton = container.getElementsByClassName('cancel')[0] as HTMLButtonElement;
    const rememberCheckbox = container.getElementsByClassName(
        'remember-permissions',
    )[0] as HTMLInputElement;

    if (systemInfo?.browser.outdated) {
        h3.innerText = 'Outdated browser';
    }

    return new Promise(resolve => {
        ackButton.onclick = () => {
            if (rememberCheckbox && rememberCheckbox.checked) {
                storage.save(state => ({
                    ...state,
                    browser: true,
                }));
            }
            showView('loader');
            resolve(true);
        };
    });
};
