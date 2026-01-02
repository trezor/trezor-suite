import { MessagesSchema as PROTO } from '@trezor/protobuf';

import { AbstractMethod } from '../core/AbstractMethod';

export default class GetNonce extends AbstractMethod<'getNonce', PROTO.GetNonce> {
    override init() {
        this.useDeviceState = false;
        // TODO should nonce really be always used with useEmptyPassphrase (as it currently is)?
        this.useEmptyPassphrase = true;
    }

    override async run() {
        const cmd = this.device.getCommands();
        const response = await cmd.typedCall('GetNonce', 'Nonce');

        return response.message;
    }
}
