// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/ChangePin.js

import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import { AbstractMethod, MethodMessage, MethodPermission } from '../core/AbstractMethod';

export default class ChangePin extends AbstractMethod<'changePin', PROTO.ChangePin> {
    constructor(message: MethodMessage<'changePin'>) {
        super(message);
        this.useDeviceState = false;
        this.skipFinalReload = false;
    }
    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    init() {
        const { payload } = this;
        Assert(PROTO.ChangePin, payload);

        this.params = {
            remove: payload.remove,
        };
    }

    async run() {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('ChangePin', 'Success', this.params);

        return response.message;
    }
}
