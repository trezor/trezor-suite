
import type { PostMessage } from '@trezor/blockchain-core/src/backend/Blockchain';
import { initCoinBackend } from '@trezor/blockchain-core/src/backend/BlockchainLink';
import type { BlockchainLinkParams } from '@trezor/blockchain-link';

import { COIN_PARAMS, type CoinParams, validateParams } from '../utils/validateParams';

export const getCurrentFiatRates = async (
    params: CoinParams & BlockchainLinkParams<'getCurrentFiatRates'>,
    postMessage: PostMessage,
) => {
    validateParams(params, [
        ...COIN_PARAMS,
        { name: 'currencies', type: 'array' },
        { name: 'token', type: 'string' },
    ]);
    const backend = await initCoinBackend(params, postMessage);
    const { currencies, token } = params;

    return backend.getCurrentFiatRates({ currencies, token });
};
