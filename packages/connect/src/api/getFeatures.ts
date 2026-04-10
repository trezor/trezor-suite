// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/GetFeatures.js

import { UI_REQUEST } from '@trezor/connect-common';

import type { MethodMessage, MethodPermission } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';

export default class GetFeatures extends AbstractMethod<'getFeatures'> {
    constructor(message: MethodMessage<'getFeatures'>) {
        super(message, undefined);

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

    checkFirmwareRange() {
        return undefined;
    }

    run() {
        return Promise.resolve(this.getDevice().features);
    }
}
