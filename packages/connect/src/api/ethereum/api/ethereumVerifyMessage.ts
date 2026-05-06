// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/EthereumVerifyMessage.js

import {
    EthereumVerifyMessage as EthereumVerifyMessageSchema,
    type MethodPermission,
} from '@trezor/connect-common';
import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { validateModelOneMessageSize } from '../../../device/validateMessageSize';
import { messageToHex, stripHexPrefix } from '../../../utils/formatUtils';

export default class EthereumVerifyMessage extends AbstractMethod<
    'ethereumVerifyMessage',
    PROTO.EthereumVerifyMessage
> {
    constructor(message: MethodMessage<'ethereumVerifyMessage'>) {
        const { payload } = message;

        // validate incoming parameters
        Assert(EthereumVerifyMessageSchema, payload);

        const messageHex = payload.hex
            ? messageToHex(payload.message)
            : Buffer.from(payload.message, 'utf8').toString('hex');
        const params = {
            address: stripHexPrefix(payload.address),
            signature: stripHexPrefix(payload.signature),
            message: messageHex,
        };

        super(message, params);
        this.requiredDeviceCapabilities = ['Capability_Ethereum'];
    }

    get requiredPermissions(): MethodPermission[] {
        return ['read'];
    }

    get info() {
        return 'Verify message';
    }

    async run() {
        validateModelOneMessageSize(this.getDevice(), this.params.message);

        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('EthereumVerifyMessage', 'Success', this.params);

        return response.message;
    }
}
