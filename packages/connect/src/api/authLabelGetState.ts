import { type PermissionRequest } from '@trezor/connect-common';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';

export default class AuthLabelGetState extends AbstractMethod<
    'authLabelGetState',
    PROTO.AuthLabelGetState
> {
    constructor(message: MethodMessage<'authLabelGetState'>) {
        const { payload } = message;

        Assert(PROTO.AuthLabelGetState, payload);

        super(message, {});
    }

    get requiredPermissions(): PermissionRequest[] {
        return [{ permission: 'read_xpub' }];
    }

    get info() {
        return 'Authenticated labeling: get state';
    }

    async run() {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('AuthLabelGetState', 'AuthLabelState', this.params);

        return response.message;
    }
}
