
import type { PostMessage } from '@trezor/blockchain-core/src/backend/Blockchain';
import { initCoinBackend } from '@trezor/blockchain-core/src/backend/BlockchainLink';
import type { BlockchainLinkParams } from '@trezor/blockchain-link';

import { COIN_PARAMS, type CoinParams, validateParams } from '../utils/validateParams';

export const getFiatRatesForTimestamps = async (
    params: CoinParams & BlockchainLinkParams<'getFiatRatesForTimestamps'>,
    postMessage: PostMessage,
) => {
    validateParams(params, [
        ...COIN_PARAMS,
        { name: 'currencies', type: 'array' },
        { name: 'timestamps', type: 'array', required: true },
        { name: 'token', type: 'string' },
    ]);
    const backend = await initCoinBackend(params, postMessage);
    const { currencies, timestamps, token } = params;

    return backend.getFiatRatesForTimestamps({ currencies, timestamps, token });
};
