// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/GetFeatures.js

import { AbstractMethod, MethodPermission, Payload } from '../core/AbstractMethod';
import type { Device } from '../device/Device';
import { UI_REQUEST } from '../events';

export default class GetFeatures extends AbstractMethod<'getFeatures'> {
    constructor(message: { id?: number; payload: Payload<'getFeatures'> }) {
        super(message);

        this.useUi = false;
        this.allowDeviceMode = [
            ...this.allowDeviceMode,
            UI_REQUEST.INITIALIZE,
            UI_REQUEST.BOOTLOADER,
        ];
        this.useDeviceState = false;
        this.useEmptyPassphrase = true;
    }

    get requiredPermissions(): MethodPermission[] {
        return [];
    }

    init() {
        // Configuration already set in constructor
    }

    checkFirmwareRange(_device: Device) {
        return undefined;
    }

    run(device: Device) {
        return Promise.resolve(device.features);
    }
}
