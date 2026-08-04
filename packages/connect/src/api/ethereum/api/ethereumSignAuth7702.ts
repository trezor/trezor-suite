import { getAddress, isAddress } from 'viem';

import {
    EthereumSignAuth7702 as EthereumSignAuth7702Schema,
    ExperimentalMethod,
} from '@trezor/connect-common';
import type {
    EthereumNetworkInfoDefinitionValues,
    PermissionRequest,
} from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getEthereumNetwork } from '../../../data/coinInfo';
import { getNetworkLabel } from '../../../utils/ethereumUtils';
import { addHexPrefix } from '../../../utils/formatUtils';
import { getSerializedPath, validatePath } from '../../../utils/pathUtils';
import {
    decodeEthereumDefinition,
    ethereumNetworkInfoFromDefinition,
    getEthereumDefinitions,
} from '../ethereumDefinitions';

// Delegating to the zero address clears an existing delegation, see EIP-7702.
const REVOKE_DELEGATE = '0x0000000000000000000000000000000000000000';

// `chain_id: 0` makes the authorization valid on every EVM chain, so there is no network to resolve.
const ALL_CHAINS = 0;

type Params = {
    proto: PROTO.EthereumSignAuth7702;
    network?: EthereumNetworkInfoDefinitionValues;
};

// Delegating an account is expensive to get wrong, so a mixed-case address has to carry a valid
// EIP-55 checksum; an all-lowercase address is accepted as-is. The device renders `delegate`
// exactly as it was received, hence the normalization to the checksummed form.
const normalizeDelegate = (delegate: string) => {
    if (!isAddress(delegate, { strict: true })) {
        throw ERRORS.TypedError(
            'Method_InvalidParameter',
            'Parameter "delegate" is not a valid Ethereum address.',
        );
    }

    return getAddress(delegate);
};

export default class EthereumSignAuth7702 extends AbstractMethod<'ethereumSignAuth7702', Params> {
    constructor(message: MethodMessage<'ethereumSignAuth7702'>) {
        const { payload } = message;

        // validate incoming parameters
        Assert(EthereumSignAuth7702Schema, payload);
        Assert(ExperimentalMethod, payload);

        const address_n = validatePath(payload.path, 3);
        const network = getEthereumNetwork(address_n);

        const params = {
            proto: {
                address_n,
                chain_id: payload.chainId,
                delegate: normalizeDelegate(payload.delegate),
                nonce: payload.nonce,
            },
            network,
        };

        super(message, params);
        this.requiredFirmwareCoins = [network];
        this.requiredDeviceCapabilities = ['Capability_Ethereum'];
    }

    get requiredPermissions(): PermissionRequest[] {
        return this.coinPerms('sign', this.requiredFirmwareCoins);
    }

    async initAsync() {
        const { chain_id } = this.params.proto;
        if (chain_id === ALL_CHAINS) return;

        // The path only tells us the slip44 coin, while the authorization is bound to `chainId`.
        // Definitions let the device name the chain instead of showing a raw chain id.
        const definitions = await getEthereumDefinitions({ chainId: chain_id });
        this.params.proto.definitions = definitions;

        const decoded = decodeEthereumDefinition(definitions);
        if (decoded.network) {
            this.params.network = ethereumNetworkInfoFromDefinition(decoded.network);
        }
    }

    get info() {
        const label =
            this.params.proto.delegate === REVOKE_DELEGATE
                ? 'Revoke #NETWORK EIP-7702 delegation'
                : 'Sign #NETWORK EIP-7702 authorization';

        return getNetworkLabel(label, this.params.network);
    }

    getButtonRequestData(code: string) {
        if (code === 'ButtonRequest_SignTx') {
            return {
                type: 'message' as const,
                coin: this.params.network?.shortcut ?? 'ETH',
                serializedPath: getSerializedPath(this.params.proto.address_n),
                message: JSON.stringify(
                    {
                        chainId: this.params.proto.chain_id,
                        delegate: this.params.proto.delegate,
                        nonce: this.params.proto.nonce,
                    },
                    null,
                    2,
                ),
            };
        }
    }

    async run() {
        const cmd = this.getDevice().getCommands();

        const response = await cmd.typedCall(
            'EthereumSignAuth7702',
            'EthereumAuth7702Signature',
            this.params.proto,
        );

        const { signature_v, signature_r, signature_s } = response.message;

        return {
            yParity: signature_v,
            r: addHexPrefix(signature_r),
            s: addHexPrefix(signature_s),
        };
    }
}
