// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/SetBrightness.js

import { type MethodPermission } from '@trezor/connect-common';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';

export default class SetBrightness extends AbstractMethod<'setBrightness', PROTO.SetBrightness> {
    constructor(message: MethodMessage<'setBrightness'>) {
        const { payload } = message;

        Assert(PROTO.SetBrightness, payload);

        const params = { value: payload.value };

        super(message, params);
        this.skipFinalReload = false;
        this.useDeviceState = false;
    }
    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    init() {}

    async run() {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('SetBrightness', 'Success', this.params);

        return response.message;
    }
}
