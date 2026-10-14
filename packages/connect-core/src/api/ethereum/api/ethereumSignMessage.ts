// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/EthereumSignMessage.js

import type { EthereumNetworkInfo, PermissionRequest } from '@trezor/connect-common';
import { EthereumSignMessage as EthereumSignMessageSchema } from '@trezor/connect-common';
import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getEthereumNetwork } from '../../../data/coinInfo';
import { validateModelOneMessageSize } from '../../../device/validateMessageSize';
import { getDefinitionsVersion } from '../../../utils/definitionsUtils';
import { getNetworkLabel } from '../../../utils/ethereumUtils';
import { hexToText, messageToHex } from '../../../utils/formatUtils';
import { getSerializedPath, getSlip44ByPath, validatePath } from '../../../utils/pathUtils';
import { getEthereumDefinitions } from '../ethereumDefinitions';

type Params = {
    proto: PROTO.EthereumSignMessage;
    readableMessage: string;
    network?: EthereumNetworkInfo;
};

export default class EthereumSignMessage extends AbstractMethod<'ethereumSignMessage', Params> {
    constructor(message: MethodMessage<'ethereumSignMessage'>) {
        const { payload } = message;

        // validate incoming parameters
        Assert(EthereumSignMessageSchema, payload);

        const address_n = validatePath(payload.path, 3);
        const network = getEthereumNetwork(address_n);

        const messageHex = payload.hex
            ? messageToHex(payload.message)
            : Buffer.from(payload.message, 'utf8').toString('hex');

        const readableMessage = payload.hex ? hexToText(payload.message) : payload.message;

        const params = { proto: { address_n, message: messageHex }, readableMessage, network };

        super(message, params);
        this.requiredFirmwareCoins = [network];
        this.requiredDeviceCapabilities = ['Capability_Ethereum'];
    }

    get requiredPermissions(): PermissionRequest[] {
        return this.coinPerms('sign', this.requiredFirmwareCoins);
    }

    get info() {
        return getNetworkLabel('Sign #NETWORK message', this.params.network);
    }

    getButtonRequestData(code: string, name?: string) {
        if (code === 'ButtonRequest_Other' && name === 'sign_message') {
            return {
                type: 'message' as const,
                coin: this.params.network?.shortcut ?? 'ETH',
                serializedPath: getSerializedPath(this.params.proto.address_n),
                message: this.params.readableMessage,
            };
        }
    }

    private async getEncodedNetwork() {
        if (this.params.network) return;

        const definitions = await getEthereumDefinitions({
            slip44: getSlip44ByPath(this.params.proto.address_n),
            version: getDefinitionsVersion(this.getDevice()),
        });

        return definitions.encoded_network;
    }

    async run() {
        validateModelOneMessageSize(this.getDevice(), this.params.proto.message);

        const cmd = this.getDevice().getCommands();
        const encodedNetwork = await this.getEncodedNetwork();

        const response = await cmd.typedCall('EthereumSignMessage', 'EthereumMessageSignature', {
            ...this.params.proto,
            encoded_network: encodedNetwork,
        });

        return response.message;
    }
}
