// origin: https://github.com/trezor/connect/blob/develop/src/js/webusb/extensionPermissions.js

import { sendMessage } from '@trezor/connect/lib/utils/windowsUtils';
import { config } from '@trezor/connect/lib/data/config';

// This file is hosted on https://connect.trezor.io/*/extension-permissions.html
// It's included WITHIN webextension application in trezor-usb-permissions.html to allow pairing webusb and trezor.io domain properly.

const onLoad = () => {
    sendMessage('usb-permissions-init', '*');
};

const init = (label: string) => {
    const extensionName = document.getElementsByClassName('extension-name')[0] as HTMLElement;
    extensionName.innerText = label;

    const usbButton = document.getElementsByClassName('confirm')[0] as HTMLButtonElement;
    const cancelButton = document.getElementsByClassName('cancel')[0] as HTMLButtonElement;

    usbButton.onclick = async () => {
        const { usb } = navigator;
        if (usb) {
            try {
                await usb.requestDevice({ filters: config.webusb });
                sendMessage('usb-permissions-close', '*');
            } catch (error) {
                // empty
            }
        }
    };

    cancelButton.onclick = () => {
        sendMessage('usb-permissions-close', '*');
    };
};

const handleMessage = ({ data, origin }: any) => {
    if (data && data.type === 'usb-permissions-init') {
        window.removeEventListener('message', handleMessage, false);
        const knownHost = config.knownHosts.find(host => host.origin === data.extension);
        const label = knownHost && knownHost.label ? knownHost.label : origin;
        init(label);
    }
};

window.addEventListener('load', onLoad, false);
window.addEventListener('message', handleMessage, false);
