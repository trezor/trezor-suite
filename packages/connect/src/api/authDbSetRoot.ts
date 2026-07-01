import { type MethodPermission } from '@trezor/connect-common';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';

export default class AuthDbSetRoot extends AbstractMethod<'authDbSetRoot', PROTO.AuthDbSetRoot> {
    constructor(message: MethodMessage<'authDbSetRoot'>) {
        const { payload } = message;
        Assert(PROTO.AuthDbSetRoot, payload);

        const params = {
            root: payload.root,
        };

        super(message, params);
        this.useDeviceState = false;
        this.useEmptyPassphrase = true;
    }

    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    get confirmation() {
        return {
            view: 'device-management' as const,
            label: 'Update the address-database Merkle root stored on the device?',
        };
    }

    get info() {
        return 'Set address-database Merkle root';
    }

    async run() {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('AuthDbSetRoot', 'AuthDbSetRootResponse', this.params);

        return response.message;
    }
}
