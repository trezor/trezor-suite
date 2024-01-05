// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/ChangePin.js

import { AbstractMethod } from '../core/AbstractMethod';
import { Assert } from '@trezor/schema-utils';
import { PROTO } from '../constants';

export default class ChangePin extends AbstractMethod<'changePin', PROTO.ChangePin> {
    init() {
        this.requiredPermissions = ['management'];
        this.useDeviceState = false;

        const { payload } = this;
        Assert(PROTO.ChangePin, payload);

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
