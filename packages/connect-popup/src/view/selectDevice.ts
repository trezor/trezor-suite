// origin: https://github.com/trezor/connect/blob/develop/src/js/popup/view/selectDevice.js

import {
    UI,
    POPUP,
    ERRORS,
    createUiResponse,
    UiRequestSelectDevice,
    UI_EVENT,
    TRANSPORT,
} from '@trezor/connect';
import { TREZOR_USB_DESCRIPTORS } from '@trezor/transport/lib/constants';
import { SUITE_BRIDGE_URL, SUITE_UDEV_URL, TREZOR_SUPPORT_URL } from '@trezor/urls';
import { container, getState, showView, postMessage } from './common';

const initWebUsbButton = (showLoader: boolean) => {
    const { usb } = window.navigator;
    const webusbContainer = container.getElementsByClassName('webusb')[0] as HTMLElement;
    webusbContainer.style.display = 'flex';
    const button = webusbContainer.getElementsByTagName('button')[0];

    button.innerHTML = '<span class="plus"></span><span class="text">Pair devices</span>';

    const onClick = async () => {
        if (!usb) {
            window.postMessage({ type: POPUP.EXTENSION_USB_PERMISSIONS }, window.location.origin);
            return;
        }
        try {
            await window.navigator.usb.requestDevice({
                filters: TREZOR_USB_DESCRIPTORS,
            });

            const { iframe, core } = getState();

            if (iframe) {
                iframe.postMessage({
                    event: UI_EVENT,
                    type: TRANSPORT.REQUEST_DEVICE,
                });
                if (showLoader) {
                    showView('loader');
                }
            } else if (core) {
                core.enumerate();
            }
        } catch (error) {
            // empty, do nothing, should not happen anyway
            console.error(error);
        }
    };

    button.onclick = onClick;
};

export const selectDevice = (payload: UiRequestSelectDevice['payload']) => {
    if (!payload) return;
    if (!payload.devices || !Array.isArray(payload.devices) || payload.devices.length === 0) {
        // No device connected
        showView('connect');
        if (payload.webusb) {
            initWebUsbButton(true);
        }
        return;
    }

    showView('select-device');
    if (payload.webusb) {
        initWebUsbButton(false);
    }

    // If only 'remember device for now' toggle and no webusb button is available
    // show it right under the table
    if (!payload.webusb) {
        const wrapper = container.getElementsByClassName('wrapper')[0] as HTMLElement;
        wrapper.style.justifyContent = 'normal';
    }

    // Populate device list
    const deviceList = container.getElementsByClassName('select-device-list')[0];
    // deviceList.innerHTML = '';
    const rememberCheckbox = container.getElementsByClassName(
        'remember-device',
    )[0] as HTMLInputElement;

    // Show readable devices first
    payload.devices.sort((d1, d2) => {
        if (d1.type === 'unreadable' && d2.type !== 'unreadable') {
            return 1;
        }
        if (d1.type !== 'unreadable' && d2.type === 'unreadable') {
            return -1;
        }
        return 0;
    });

    payload.devices.forEach(device => {
        const deviceButton = document.createElement('button');
        deviceButton.className = 'list';
        if (device.type !== 'unreadable') {
            deviceButton.addEventListener('click', () => {
                postMessage(
                    createUiResponse(UI.RECEIVE_DEVICE, {
                        remember: rememberCheckbox && rememberCheckbox.checked,
                        device,
                    }),
                );
                showView('loader');
            });
        }

        const deviceIcon = document.createElement('span');
        deviceIcon.className = 'trezor_icon';

        const { features } = device;

        if (features) {
            deviceIcon.classList.add(`trezor_icon_${features.internal_model.toLowerCase()}`);
        } else {
            deviceIcon.classList.add('trezor_icon_unknown');
        }

        const deviceName = document.createElement('span');
        deviceName.className = 'device-name';
        deviceName.textContent = device.label;

        const wrapper = document.createElement('div');
        wrapper.className = 'wrapper';
        wrapper.appendChild(deviceIcon);
        wrapper.appendChild(deviceName);
        deviceButton.appendChild(wrapper);

        if (device.type !== 'acquired' || device.status === 'occupied') {
            deviceButton.classList.add('device-explain');

            const explanation = document.createElement('div');
            explanation.className = 'explain';

            // handle unreadable device
            if (device.type === 'unreadable') {
                const { systemInfo } = getState();
                // default explanation: contact support

                let explanationContent = `Please <a href="${TREZOR_SUPPORT_URL}" target="_blank" rel="noreferrer noopener" onclick="window.closeWindow();">contact support.</a>`;
                // linux + LIBUSB_ERROR handling
                if (
                    systemInfo?.os.family === 'Linux' &&
                    device.error.indexOf(ERRORS.LIBUSB_ERROR_MESSAGE) >= 0
                ) {
                    explanationContent = `Please install <a href="${SUITE_UDEV_URL}" target="_blank" rel="noreferrer noopener" onclick="window.closeWindow();">Udev rules</a> to use Trezor device.`;
                }
                // webusb error handling (top priority)
                if (payload.webusb) {
                    explanationContent = `Please install <a href="${SUITE_BRIDGE_URL}" target="_blank" rel="noreferrer noopener" onclick="window.closeWindow();">Bridge</a> to use Trezor device.`;
                }
                deviceButton.disabled = true;
                deviceName.textContent = 'Unrecognized device';
                explanation.innerHTML = `${device.error}<br />${explanationContent}`;
            }

            if (device.type === 'unacquired' || device.status === 'occupied') {
                deviceName.textContent = 'Inactive device';
                deviceButton.classList.add('unacquired');
                explanation.classList.add('unacquired');
                explanation.innerHTML =
                    'Click to activate. This device is used by another application.';

                if (device.type === 'acquired') {
                    deviceName.textContent = device.label;
                }
            }

            deviceButton.appendChild(explanation);
        }

        deviceList.appendChild(deviceButton);
    });
};
