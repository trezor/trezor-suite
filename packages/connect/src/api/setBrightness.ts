// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/SetBrightness.js

import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import { AbstractMethod, MethodPermission, Payload } from '../core/AbstractMethod';

export default class SetBrightness extends AbstractMethod<'setBrightness', PROTO.SetBrightness> {
    constructor(message: { id?: number; payload: Payload<'setBrightness'> }) {
        super(message);
        this.skipFinalReload = false;
        this.useDeviceState = false;
    }
    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    init() {
        const { payload } = this;

        Assert(PROTO.SetBrightness, payload);

        this.params = {
            value: payload.value,
        };
    }

    async run() {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('SetBrightness', 'Success', this.params);

        return response.message;
    }
}
