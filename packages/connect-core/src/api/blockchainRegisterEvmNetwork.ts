import { type PermissionRequest, asCoinSymbol } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert, Type } from '@trezor/schema-utils';
import { deepEqual } from '@trezor/utils';

import { reconnectAllBackends, setCustomBackend } from '../backend/BlockchainLink';
import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import {
    type RegisterEthereumNetworkParams,
    getEthereumNetwork,
    registerEthereumNetwork,
} from '../data/coinInfo';

const RegisterEvmNetworkPayload = Type.Object({
    symbol: Type.String({ minLength: 1 }),
    name: Type.String({ minLength: 1 }),
    chainId: Type.Integer({ minimum: 1 }),
    rpcUrls: Type.Array(Type.String({ minLength: 1 }), { minItems: 1 }),
    testnet: Type.Optional(Type.Boolean()),
});

const RPC_URL_PROTOCOLS = ['http:', 'https:', 'ws:', 'wss:'];

const isRpcUrl = (url: string) => {
    try {
        return RPC_URL_PROTOCOLS.includes(new URL(url).protocol);
    } catch {
        return false;
    }
};

export default class BlockchainRegisterEvmNetwork extends AbstractMethod<
    'blockchainRegisterEvmNetwork',
    RegisterEthereumNetworkParams
> {
    constructor(message: MethodMessage<'blockchainRegisterEvmNetwork'>) {
        const { payload } = message;

        Assert(RegisterEvmNetworkPayload, payload);

        const invalidUrl = payload.rpcUrls.find(url => !isRpcUrl(url));
        if (invalidUrl !== undefined) {
            throw ERRORS.TypedError(
                'Method_InvalidParameter',
                `Parameter "rpcUrls" contains an unsupported URL: ${invalidUrl}`,
            );
        }

        const { symbol, name, chainId, rpcUrls } = payload;

        super(message, { symbol, name, chainId, rpcUrls });
        this.useDevice = false;
    }

    get requiredPermissions(): PermissionRequest[] {
        return [{ permission: 'internal' }];
    }

    get info() {
        return 'Register EVM network';
    }

    async run() {
        const { symbol, rpcUrls } = this.params;
        const previousUrls = getEthereumNetwork(asCoinSymbol(symbol))?.blockchainLink?.url;

        const coinInfo = registerEthereumNetwork(this.params);

        // A backend already connected to the previous URLs keeps them until it is reconnected.
        if (previousUrls && !deepEqual(previousUrls, rpcUrls)) {
            setCustomBackend(coinInfo, coinInfo.blockchainLink);

            // Whether the new URLs are reachable is not a registration concern; a failed connection
            // is retried and reported by the backend itself.
            await reconnectAllBackends(coinInfo).catch(() => {});
        }

        return { symbol };
    }
}
