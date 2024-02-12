// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/ApplyFlags.js

import { AbstractMethod } from '../core/AbstractMethod';
import { PROTO } from '../constants';
import { Assert } from '@trezor/schema-utils';

export default class EraseBonds extends AbstractMethod<'eraseBonds', PROTO.ApplyFlags> {
    init() {
        this.requiredPermissions = ['management'];
        this.useDeviceState = false;

        const { payload } = this;

        Assert(PROTO.EraseBonds, payload);
    }

    async run() {
        const cmd = this.device.getCommands();
        const response = await cmd.typedCall('EraseBonds', 'Success', {});

        return response.message;
    }
}
