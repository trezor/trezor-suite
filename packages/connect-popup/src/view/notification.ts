// origin: https://github.com/trezor/connect/blob/develop/src/js/popup/view/notification.js

import { UiRequestUnexpectedDeviceMode } from '@trezor/connect';
import { views } from './common';

export const showFirmwareUpdateNotification = (
    device: UiRequestUnexpectedDeviceMode['payload'],
) => {
    const container = document.getElementsByClassName('notification')[0];
    const warning = container.querySelector('.firmware-update-notification');
    if (warning) {
        // already exists
        return;
    }
    if (!device.features) return;
    if (!device.firmwareRelease) return;

    const view = views.getElementsByClassName('firmware-update-notification');
    const notification = document.createElement('div');
    notification.className = 'firmware-update-notification notification-item';
    const viewItem = view.item(0);
    if (viewItem) {
        notification.innerHTML = viewItem.innerHTML;
    }

    const button = notification.getElementsByClassName('notification-button')[0];
    // REF-TODO: import from future @trezor/constants / @trezor/urls package?
    button.setAttribute('href', 'https://suite.trezor.io/web/firmware/');

    container.appendChild(notification);

    const close = notification.querySelector('.close-icon');
    if (close) {
        close.addEventListener('click', () => {
            container.removeChild(notification);
        });
    }
};

export const showBridgeUpdateNotification = () => {
    const container = document.getElementsByClassName('notification')[0];
    const warning = container.querySelector('.bridge-update-notification');
    if (warning) {
        // already exists
        return;
    }

    const view = views.getElementsByClassName('bridge-update-notification');
    const notification = document.createElement('div');
    notification.className = 'bridge-update-notification notification-item';
    const viewItem = view.item(0);
    if (viewItem) {
        notification.innerHTML = viewItem.innerHTML;
    }

    container.appendChild(notification);

    const close = notification.querySelector('.close-icon');
    if (close) {
        close.addEventListener('click', () => {
            container.removeChild(notification);
        });
    }
};

export const showBackupNotification = (_device: UiRequestUnexpectedDeviceMode['payload']) => {
    const container = document.getElementsByClassName('notification')[0];
    const warning = container.querySelector('.backup-notification');
    if (warning) {
        // already exists
        return;
    }

    const view = views.getElementsByClassName('backup-notification');
    const notification = document.createElement('div');
    notification.className = 'backup-notification notification-item';
    const viewItem = view.item(0);
    if (viewItem) {
        notification.innerHTML = viewItem.innerHTML;
    }

    container.appendChild(notification);

    const close = notification.querySelector('.close-icon');
    if (close) {
        close.addEventListener('click', () => {
            container.removeChild(notification);
        });
    }
};
