import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { MethodPermission, Payload } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';

export default class GetNonce extends AbstractMethod<'getNonce', PROTO.GetNonce> {
    constructor(message: { id?: number; payload: Payload<'getNonce'> }) {
        super(message);
        this.useDeviceState = false;
        // TODO should nonce really be always used with useEmptyPassphrase (as it currently is)?
        this.useEmptyPassphrase = true;
    }

    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    override init() {}

    override async run() {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('GetNonce', 'Nonce');

        return response.message;
    }
}
