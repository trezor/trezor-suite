import type { BlockchainLinkParams } from '@trezor/blockchain-link';

import type { PostMessage } from '../backend/Blockchain';
import { initCoinBackend } from '../backend/BlockchainLink';
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
