// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/ApplyFlags.js

import { Assert } from '@trezor/schema-utils';

import { AbstractMethod } from '../core/AbstractMethod';
import { PROTO } from '../constants';

export default class ApplyFlags extends AbstractMethod<'applyFlags', PROTO.ApplyFlags> {
    init() {
        this.requiredPermissions = ['management'];
        this.useDeviceState = false;

        const { payload } = this;

        Assert(PROTO.ApplyFlags, payload);

        this.params = {
            flags: payload.flags,
        };
    }

    get confirmation() {
        return {
            view: 'device-management' as const,
            customConfirmButton: {
                className: 'confirm',
                label: 'Proceed',
            },
            label: 'Do you really want to apply flags?',
        };
    }

    async run() {
        const cmd = this.device.getCommands();
        const response = await cmd.typedCall('ApplyFlags', 'Success', this.params);

        return response.message;
    }
}
