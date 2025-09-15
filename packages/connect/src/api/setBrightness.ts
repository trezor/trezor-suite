// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/SetBrightness.js

import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import { AbstractMethod } from '../core/AbstractMethod';

export default class SetBrightness extends AbstractMethod<'setBrightness', PROTO.SetBrightness> {
    init() {
        this.requiredPermissions = ['management'];
        this.skipFinalReload = false;
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
