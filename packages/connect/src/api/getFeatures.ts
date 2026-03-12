// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/GetFeatures.js

import { AbstractMethod, MethodContext, MethodMessage, MethodPermission } from '../core/AbstractMethod';
import { UI_REQUEST } from '../events';

export default class GetFeatures extends AbstractMethod<'getFeatures'> {
    constructor(message: MethodMessage<'getFeatures'>, context: MethodContext) {
        super(message, context);

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

    checkFirmwareRange() {
        return undefined;
    }

    run() {
        return Promise.resolve(this.getDevice().features);
    }
}
