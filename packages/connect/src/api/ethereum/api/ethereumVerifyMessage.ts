// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/EthereumVerifyMessage.js

import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import { AbstractMethod, MethodContext, MethodMessage, MethodPermission } from '../../../core/AbstractMethod';
import { validateModelOneMessageSize } from '../../../device/validateMessageSize';
import { EthereumVerifyMessage as EthereumVerifyMessageSchema } from '../../../types';
import { messageToHex, stripHexPrefix } from '../../../utils/formatUtils';
import { getFirmwareRange } from '../../common/paramsValidator';

export default class EthereumVerifyMessage extends AbstractMethod<
    'ethereumVerifyMessage',
    PROTO.EthereumVerifyMessage
> {
    constructor(message: MethodMessage<'ethereumVerifyMessage'>, context: MethodContext) {
        super(message, context);
        this.requiredDeviceCapabilities = ['Capability_Ethereum'];
        this.firmwareRange = getFirmwareRange(this.name, null, this.firmwareRange);
    }

    get requiredPermissions(): MethodPermission[] {
        return ['read'];
    }

    init() {
        const { payload } = this;

        // validate incoming parameters
        Assert(EthereumVerifyMessageSchema, payload);

        const messageHex = payload.hex
            ? messageToHex(payload.message)
            : Buffer.from(payload.message, 'utf8').toString('hex');
        this.params = {
            address: stripHexPrefix(payload.address),
            signature: stripHexPrefix(payload.signature),
            message: messageHex,
        };
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
