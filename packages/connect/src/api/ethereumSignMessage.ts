// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/EthereumSignMessage.js

import { AbstractMethod } from '../core/AbstractMethod';
import { validateParams, getFirmwareRange } from './common/paramsValidator';
import { getSlip44ByPath, validatePath } from '../utils/pathUtils';
import { getEthereumNetwork } from '../data/coinInfo';
import { getNetworkLabel } from '../utils/ethereumUtils';
import { messageToHex } from '../utils/formatUtils';
import type { PROTO } from '../constants';
import { getEthereumDefinitions } from './ethereum/ethereumDefinitions';

export default class EthereumSignMessage extends AbstractMethod<
    'ethereumSignMessage',
    PROTO.EthereumSignMessage
> {
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

        const messageHex = payload.hex
            ? messageToHex(payload.message)
            : Buffer.from(payload.message, 'utf8').toString('hex');
        this.params = {
            address_n: path,
            message: messageHex,
        };
    }

    get info() {
        return getNetworkLabel('Sign #NETWORK message', getEthereumNetwork(this.params.address_n));
    }

    async run() {
        const cmd = this.device.getCommands();
        const { address_n, message } = this.params;
        const network = getEthereumNetwork(address_n);
        const slip44 = getSlip44ByPath(address_n);
        const definitions = await getEthereumDefinitions({
            chainId: network?.chainId,
            slip44,
        });

        const definitionParams = {
            ...(definitions.encoded_network && {
                encoded_network: definitions.encoded_network,
            }),
        };
        const response = await cmd.typedCall('EthereumSignMessage', 'EthereumMessageSignature', {
            ...definitionParams,
            address_n,
            message,
        });
        return response.message;
    }
}
