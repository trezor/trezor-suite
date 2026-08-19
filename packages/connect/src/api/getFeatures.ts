// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/GetFeatures.js

import { type PermissionRequest, UI_EVENTS } from '@trezor/connect-common';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';

export default class GetFeatures extends AbstractMethod<'getFeatures'> {
    constructor(message: MethodMessage<'getFeatures'>) {
        super(message, undefined);

        this.useUi = false;
        this.allowDeviceMode = [
            ...this.allowDeviceMode,
            UI_EVENTS.DEVICE_NOT_INITIALIZED,
            UI_EVENTS.DEVICE_IN_BOOTLOADER,
        ];
        this.useDeviceState = false;
        this.useEmptyPassphrase = true;
    }

    get requiredPermissions(): PermissionRequest[] {
        return [{ permission: 'read_features' }];
    }

    checkFirmwareRange() {
        return undefined;
    }

    run() {
        return Promise.resolve(this.getDevice().features);
    }
}
