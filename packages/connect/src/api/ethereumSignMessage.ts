// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/EthereumSignMessage.js

import { AbstractMethod } from '../core/AbstractMethod';
import { validateParams, getFirmwareRange } from './common/paramsValidator';
import { validatePath } from '../utils/pathUtils';
import { getEthereumNetwork } from '../data/CoinInfo';
import { getNetworkLabel } from '../utils/ethereumUtils';
import { messageToHex } from '../utils/formatUtils';
import type { PROTO } from '../constants';

export default class EthereumSignMessage extends AbstractMethod<'ethereumSignMessage'> {
    params: PROTO.EthereumSignMessage;

    init() {
        this.requiredPermissions = ['read', 'write'];

        const { payload } = this;

        // validate incoming parameters
        validateParams(payload, [
            { name: 'path', required: true },
            { name: 'message', type: 'string', required: true },
            { name: 'hex', type: 'boolean' },
        ]);

        const path = validatePath(payload.path, 3);
        const network = getEthereumNetwork(path);
        this.firmwareRange = getFirmwareRange(this.name, network, this.firmwareRange);

        this.info = getNetworkLabel('Sign #NETWORK message', network);

        const messageHex = payload.hex
            ? messageToHex(payload.message)
            : Buffer.from(payload.message, 'utf8').toString('hex');
        this.params = {
            address_n: path,
            message: messageHex,
        };
    }

    async run() {
        const cmd = this.device.getCommands();
        const { address_n, message } = this.params;
        const response = await cmd.typedCall('EthereumSignMessage', 'EthereumMessageSignature', {
            address_n,
            message,
        });
        return response.message;
    }
}
