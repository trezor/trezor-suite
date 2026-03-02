import { MessagesSchema as PROTO } from '@trezor/protobuf';

import { AbstractMethod, MethodPermission, Payload } from '../core/AbstractMethod';
import type { Device } from '../device/Device';

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

    override async run(device: Device) {
        const cmd = device.getCommands();
        const response = await cmd.typedCall('GetNonce', 'Nonce');

        return response.message;
    }
}
