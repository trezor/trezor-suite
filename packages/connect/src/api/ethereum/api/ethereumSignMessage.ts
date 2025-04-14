// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/EthereumSignMessage.js

import { MessagesSchema } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { PROTO } from '../../../constants';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getEthereumNetwork } from '../../../data/coinInfo';
import {
    EthereumNetworkInfo,
    EthereumSignMessage as EthereumSignMessageSchema,
} from '../../../types';
import { getNetworkLabel } from '../../../utils/ethereumUtils';
import { messageToHex } from '../../../utils/formatUtils';
import { getSerializedPath, getSlip44ByPath, validatePath } from '../../../utils/pathUtils';
import { getFirmwareRange } from '../../common/paramsValidator';
import { getEthereumDefinitions } from '../ethereumDefinitions';

type Params = PROTO.EthereumSignMessage & {
    network?: EthereumNetworkInfo;
    definitions?: MessagesSchema.EthereumDefinitions;
};

export default class EthereumSignMessage extends AbstractMethod<'ethereumSignMessage', Params> {
    init() {
        this.requiredPermissions = ['read', 'write'];
        this.requiredDeviceCapabilities = ['Capability_Ethereum'];

        const { payload } = this;

        // validate incoming parameters
        Assert(EthereumSignMessageSchema, payload);

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

    async initAsync() {
        if (this.params.network) return;

        const { address_n } = this.params;
        const slip44 = getSlip44ByPath(address_n);
        this.params.definitions = await getEthereumDefinitions({
            slip44,
        });
    }

    get info() {
        return getNetworkLabel('Sign #NETWORK message', getEthereumNetwork(this.params.address_n));
    }

    getButtonRequestData(code: string, name?: string) {
        if (code === 'ButtonRequest_Other' && name === 'sign_message') {
            return {
                type: 'message' as const,
                coin: this.params.network?.shortcut ?? 'ETH',
                serializedPath: getSerializedPath(this.params.address_n),
                message: this.payload.message,
            };
        }
    }

    async run() {
        const cmd = this.device.getCommands();
        const { address_n, message } = this.params;

        const response = await cmd.typedCall('EthereumSignMessage', 'EthereumMessageSignature', {
            encoded_network: this.params.definitions?.encoded_network,
            address_n,
            message,
        });

        return response.message;
    }
}
