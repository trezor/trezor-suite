// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/GetDeviceState.js

import { AbstractMethod } from '../core/AbstractMethod';

export default class GetDeviceState extends AbstractMethod<'getDeviceState'> {
    async init() {
        this.requiredPermissions = [];
    }

    run() {
        return Promise.resolve({
            state: this.device.getExternalState(),
        });
    }
}
