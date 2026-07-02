import { type MethodPermission } from '@trezor/connect-common';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';

export default class AuthDbUpdateLeaf extends AbstractMethod<'authDbUpdateLeaf', PROTO.AuthDbUpdateLeaf> {
    constructor(message: MethodMessage<'authDbUpdateLeaf'>) {
        const { payload } = message;
        Assert(PROTO.AuthDbUpdateLeaf, payload);

        const params = {
            address: payload.address,
            old_value: payload.old_value,
            new_value: payload.new_value,
            proof: payload.proof ?? [],
            ...(payload.witness_address !== undefined && { witness_address: payload.witness_address }),
            ...(payload.witness_value !== undefined && { witness_value: payload.witness_value }),
            ...(payload.mac !== undefined && { mac: payload.mac }),
            ...(payload.device_id !== undefined && { device_id: payload.device_id }),
        };

        super(message, params);
        this.useDeviceState = false;
        this.useEmptyPassphrase = true;
    }

    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    get info() {
        return 'Update address-database leaf';
    }

    async run() {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('AuthDbUpdateLeaf', 'AuthDbUpdateLeafResponse', this.params);

        return response.message;
    }
}
