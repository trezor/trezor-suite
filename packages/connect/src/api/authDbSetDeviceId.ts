import { type MethodPermission } from '@trezor/connect-common';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';

export default class AuthDbSetDeviceId extends AbstractMethod<
    'authDbSetDeviceId',
    PROTO.AuthDbSetDeviceId
> {
    constructor(message: MethodMessage<'authDbSetDeviceId'>) {
        const { payload } = message;
        Assert(PROTO.AuthDbSetDeviceId, payload);

        const params = {
            device_id: payload.device_id,
        };

        super(message, params);
        this.useDeviceState = false;
        this.useEmptyPassphrase = true;
    }

    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    get info() {
        return 'Set authdb device identifier';
    }

    async run() {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall(
            'AuthDbSetDeviceId',
            'AuthDbSetDeviceIdResponse',
            this.params,
        );

        return response.message;
    }
}
