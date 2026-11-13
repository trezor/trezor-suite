import type { PostMessage } from '../backend/Blockchain';
import { initCoinBackend } from '../backend/BlockchainLink';
import { COIN_PARAMS, type CoinParams, validateParams } from '../utils/validateParams';

export const subscribeFiatRates = async (
    params: CoinParams & { currency?: string },
    postMessage: PostMessage,
) => {
    validateParams(params, [...COIN_PARAMS, { name: 'currency', type: 'string' }]);
    const backend = await initCoinBackend(params, postMessage);

    return backend.subscribeFiatRates(params.currency);
};
