import { type MethodPermission } from '@trezor/connect-common';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';

export default class AuthDbClearRoot extends AbstractMethod<'authDbClearRoot', PROTO.AuthDbClearRoot> {
    constructor(message: MethodMessage<'authDbClearRoot'>) {
        const { payload } = message;
        Assert(PROTO.AuthDbClearRoot, payload);

        super(message, {});
        this.useDeviceState = false;
        this.useEmptyPassphrase = true;
    }

    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    async run() {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('AuthDbClearRoot', 'AuthDbClearRootResponse', this.params);

        return response.message;
    }
}
