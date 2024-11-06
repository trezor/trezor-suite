// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/SetBrightness.js

import { Assert } from '@trezor/schema-utils';

import { AbstractMethod } from '../core/AbstractMethod';
import { PROTO } from '../constants';

export default class SetBrightness extends AbstractMethod<'setBrightness', PROTO.SetBrightness> {
    init() {
        this.requiredPermissions = ['management'];
        this.useDeviceState = false;
        const { payload } = this;

        Assert(PROTO.SetBrightness, payload);

        this.params = {
            value: payload.value,
        };
    }

    async run() {
        const cmd = this.device.getCommands();
        const response = await cmd.typedCall('SetBrightness', 'Success', this.params);

        return response.message;
    }
}
