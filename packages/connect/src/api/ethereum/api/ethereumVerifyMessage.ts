// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/EthereumVerifyMessage.js

import { AbstractMethod } from '../../../core/AbstractMethod';
import { validateParams, getFirmwareRange } from '../../common/paramsValidator';
import { stripHexPrefix, messageToHex } from '../../../utils/formatUtils';
import type { PROTO } from '../../../constants';

export default class EthereumVerifyMessage extends AbstractMethod<
    'ethereumVerifyMessage',
    PROTO.EthereumVerifyMessage
> {
    init() {
        this.requiredPermissions = ['read', 'write'];
        this.firmwareRange = getFirmwareRange(this.name, null, this.firmwareRange);

        const { payload } = this;

        // validate incoming parameters
        validateParams(payload, [
            { name: 'address', type: 'string', required: true },
            { name: 'signature', type: 'string', required: true },
            { name: 'message', type: 'string', required: true },
            { name: 'hex', type: 'boolean' },
        ]);

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
        const cmd = this.device.getCommands();
        const response = await cmd.typedCall('EthereumVerifyMessage', 'Success', this.params);
        return response.message;
    }
}
