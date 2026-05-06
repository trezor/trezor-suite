// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/ChangePin.js

import { type MethodPermission } from '@trezor/connect-common';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';

export default class ChangePin extends AbstractMethod<'changePin', PROTO.ChangePin> {
    constructor(message: MethodMessage<'changePin'>) {
        const { payload } = message;
        Assert(PROTO.ChangePin, payload);

        const params = { remove: payload.remove };

        super(message, params);
        this.useDeviceState = false;
        this.skipFinalReload = false;
    }
    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    async run() {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('ChangePin', 'Success', this.params);

        return response.message;
    }
}
