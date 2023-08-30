// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/GetFeatures.js

import { AbstractMethod } from '../core/AbstractMethod';
import { UI } from '../events';

export default class GetFeatures extends AbstractMethod<'getFeatures'> {
    async init() {
        this.requiredPermissions = [];
        this.useUi = false;
        this.allowDeviceMode = [...this.allowDeviceMode, UI.INITIALIZE, UI.BOOTLOADER];
        this.useDeviceState = false;
        this.skipFirmwareCheck = true;
    }

    run() {
        return Promise.resolve(this.device.features);
    }
}
