import { ERRORS } from '@trezor/connect-common/src/constants';
import { deepEqual } from '@trezor/utils';

import { reconnectAllBackends, setCustomBackend } from '../backend/BlockchainLink';
import {
    type RegisterEvmBackendCoinParams,
    getBackendCoinInfo,
    registerEvmBackendCoin,
} from '../data/coinInfo';
import { validateParams } from '../utils/validateParams';

const RPC_URL_PROTOCOLS = ['http:', 'https:', 'ws:', 'wss:'];

const isRpcUrl = (url: unknown) => {
    try {
        return typeof url === 'string' && RPC_URL_PROTOCOLS.includes(new URL(url).protocol);
    } catch {
        return false;
    }
};

const getRegisteredUrls = (symbol: string) => {
    try {
        return getBackendCoinInfo(symbol).blockchainLink?.url;
    } catch {
        return undefined;
    }
};

/** Serves an EVM network added at runtime by its RPC nodes. */
export const registerEvmNetwork = async (params: RegisterEvmBackendCoinParams) => {
    validateParams(params, [
        { name: 'symbol', type: 'string', required: true },
        { name: 'name', type: 'string', required: true },
        { name: 'rpcUrls', type: 'array', required: true },
        { name: 'blockTimeSeconds', type: 'number' },
    ]);
    if (!params.symbol || !params.name) {
        throw ERRORS.TypedError(
            'Method_InvalidParameter',
            'Parameters "symbol" and "name" are required',
        );
    }
    const invalidUrlIndex = params.rpcUrls.findIndex(url => !isRpcUrl(url));
    if (invalidUrlIndex !== -1) {
        throw ERRORS.TypedError(
            'Method_InvalidParameter',
            `Parameter "rpcUrls" contains an unsupported URL: ${params.rpcUrls[invalidUrlIndex]}`,
        );
    }
    if (
        params.blockTimeSeconds !== undefined &&
        !(Number.isFinite(params.blockTimeSeconds) && params.blockTimeSeconds > 0)
    ) {
        throw ERRORS.TypedError(
            'Method_InvalidParameter',
            'Parameter "blockTimeSeconds" must be positive',
        );
    }

    const { symbol, name, rpcUrls, blockTimeSeconds } = params;
    const previousUrls = getRegisteredUrls(symbol);
    const coinInfo = registerEvmBackendCoin({ symbol, name, rpcUrls, blockTimeSeconds });

    // A backend already connected to the previous URLs keeps them until it is reconnected.
    if (previousUrls && !deepEqual(previousUrls, rpcUrls)) {
        setCustomBackend(coinInfo, coinInfo.blockchainLink);

        // Whether the new URLs are reachable is not a registration concern; a failed connection is
        // retried and reported by the backend itself.
        await reconnectAllBackends(coinInfo).catch(() => {});
    }

    return { symbol };
};
