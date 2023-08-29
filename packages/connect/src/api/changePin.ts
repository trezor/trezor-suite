// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/ChangePin.js

import { AbstractMethod } from '../core/AbstractMethod';
import { validateParams } from './common/paramsValidator';
import type { PROTO } from '../constants';

export default class ChangePin extends AbstractMethod<'changePin', PROTO.ChangePin> {
    async init() {
        this.requiredPermissions = ['management'];
        this.useDeviceState = false;

        const { payload } = this;
        validateParams(payload, [{ name: 'remove', type: 'boolean' }]);

        this.params = {
            remove: payload.remove,
        };
    }

    async run() {
        const cmd = this.device.getCommands();
        const response = await cmd.typedCall('ChangePin', 'Success', this.params);
        return response.message;
    }
}
