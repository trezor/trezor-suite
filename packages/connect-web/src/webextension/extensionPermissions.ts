// origin: https://github.com/trezor/connect/blob/develop/src/js/webusb/extensionPermissions.js

import { config } from '@trezor/connect/lib/data/config';
import { WEBEXTENSION } from '@trezor/connect/lib/events';

// This file is hosted on https://connect.trezor.io/*/extension-permissions.html
// It's included WITHIN webextension application in trezor-usb-permissions.html to allow pairing webusb and trezor.io domain properly.

// send message from iframe to parent
export const sendMessage = (message: string, origin: string) => {
    window.parent.postMessage(message, origin);
};

const broadcastPermissionFinished = () => {
    const channel = new BroadcastChannel(WEBEXTENSION.USB_PERMISSIONS_BROADCAST);
    channel.postMessage({ type: WEBEXTENSION.USB_PERMISSIONS_FINISHED });
    channel.close();
};

const onLoad = () => {
    sendMessage(WEBEXTENSION.USB_PERMISSIONS_INIT, '*');
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
                sendMessage(WEBEXTENSION.USB_PERMISSIONS_CLOSE, '*');
                broadcastPermissionFinished();
            } catch (error) {
                // empty
            }
        }
    };

    cancelButton.onclick = () => {
        sendMessage(WEBEXTENSION.USB_PERMISSIONS_CLOSE, '*');
    };
};

const handleMessage = ({ data, origin }: any) => {
    if (data && data.type === WEBEXTENSION.USB_PERMISSIONS_INIT) {
        window.removeEventListener('message', handleMessage, false);
        const knownHost = config.knownHosts.find(host => host.origin === data.extension);
        const label = knownHost && knownHost.label ? knownHost.label : origin;
        init(label);
    }
};

window.addEventListener('load', onLoad, false);
window.addEventListener('message', handleMessage, false);
