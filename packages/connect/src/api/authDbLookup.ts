import { type MethodPermission } from '@trezor/connect-common';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';

export default class AuthDbLookup extends AbstractMethod<'authDbLookup', PROTO.AuthDbLookup> {
    constructor(message: MethodMessage<'authDbLookup'>) {
        const { payload } = message;
        Assert(PROTO.AuthDbLookup, payload);

        const params = {
            address: payload.address,
            ...(payload.value !== undefined && { value: payload.value }),
            proof: payload.proof ?? [],
            ...(payload.witness_address !== undefined && { witness_address: payload.witness_address }),
            ...(payload.witness_value !== undefined && { witness_value: payload.witness_value }),
        };

        super(message, params);
        this.useDeviceState = false;
    }

    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    async run() {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('AuthDbLookup', 'AuthDbLookupResponse', this.params);

        return response.message;
    }
}
