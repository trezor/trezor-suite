// origin: https://github.com/trezor/connect/blob/develop/src/js/popup/view/selectDevice.js

import { UI, POPUP, ERRORS, UiResponse, UiRequestSelectDevice } from '@trezor/connect';
import { container, iframe, showView, postMessage } from './common';
import { DataManager } from '@trezor/connect/lib/data/DataManager';
import { getOS } from '@trezor/connect/lib/utils/browserUtils';

const initWebUsbButton = (webusb: boolean, showLoader: boolean) => {
    if (!webusb) return;

    const webusbContainer = container.getElementsByClassName('webusb')[0] as HTMLElement;
    webusbContainer.style.display = 'flex';
    const button = webusbContainer.getElementsByTagName('button')[0];

    if (!iframe) {
        button.innerHTML = '<span class="plus"></span><span class="text">Pair devices</span>';
    }

    const usb = iframe ? iframe.clientInformation.usb : null;
    const onClick = async () => {
        if (!usb) {
            window.postMessage({ type: POPUP.EXTENSION_USB_PERMISSIONS }, window.location.origin);
            return;
        }
        try {
            await usb.requestDevice({ filters: DataManager.getConfig().webusb });
            if (showLoader) {
                showView('loader');
            }
        } catch (error) {
            // empty, do nothing
        }
    };

    button.onclick = onClick;
};

export const selectDevice = (payload: UiRequestSelectDevice['payload']) => {
    if (!payload) return;

    if (!payload.devices || !Array.isArray(payload.devices) || payload.devices.length === 0) {
        // No device connected
        showView('connect');
        initWebUsbButton(payload.webusb, true);
        return;
    }

    showView('select-device');
    initWebUsbButton(payload.webusb, false);

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
                    UiResponse(UI.RECEIVE_DEVICE, {
                        remember: rememberCheckbox && rememberCheckbox.checked,
                        device,
                    }),
                );
                showView('loader');
            });
        }

        const deviceIcon = document.createElement('span');
        deviceIcon.className = 'icon';

        if (device.features) {
            if (device.features.major_version === 2) {
                deviceIcon.classList.add('model-t');
            }
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
                const os = getOS();
                // default explanation: contact support
                // REF-TODO: move urls into @trezor/constants / @trezor/urls package?
                let explanationContent =
                    'Please <a href="https://trezor.io/support/" target="_blank" rel="noreferrer noopener" onclick="window.closeWindow();">contact support.</a>';
                // linux + LIBUSB_ERROR handling
                if (os === 'linux' && device.error.indexOf(ERRORS.LIBUSB_ERROR_MESSAGE) >= 0) {
                    explanationContent =
                        'Please install <a href="https://suite.trezor.io/web/udev/" target="_blank" rel="noreferrer noopener" onclick="window.closeWindow();">Udev rules</a> to use Trezor device.';
                }
                // webusb error handling (top priority)
                if (payload.webusb) {
                    explanationContent =
                        'Please install <a href="https://suite.trezor.io/web/bridge/" target="_blank" rel="noreferrer noopener" onclick="window.closeWindow();">Bridge</a> to use Trezor device.';
                }
                deviceButton.disabled = true;
                deviceIcon.classList.add('unknown');
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
