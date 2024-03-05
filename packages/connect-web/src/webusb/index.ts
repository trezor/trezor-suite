// origin: https://github.com/trezor/connect/blob/develop/src/js/webusb/index.js

import { config } from '@trezor/connect/src/data/config';

// handle message received from connect.js
const onload = () => {
    const exists = document.getElementsByTagName('button');
    if (exists && exists.length > 0) {
        return;
    }

    const button = document.createElement('button');
    button.className = 'default';
    button.onclick = async () => {
        const { usb } = navigator;
        if (usb) {
            try {
                await usb.requestDevice({ filters: config.webusb });
            } catch (error) {
                // empty
            }
        }
    };

    if (document.body) {
        document.body.append(button);
    }
};

window.addEventListener('load', onload);
