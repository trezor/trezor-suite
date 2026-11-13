import type { PostMessage } from '@trezor/blockchain-core/src/backend/Blockchain';
import { initCoinBackend } from '@trezor/blockchain-core/src/backend/BlockchainLink';

import { COIN_PARAMS, type CoinParams, validateParams } from '../utils/validateParams';

export const getInfo = async (params: CoinParams, postMessage: PostMessage) => {
    validateParams(params, COIN_PARAMS);
    const backend = await initCoinBackend(params, postMessage);

    return backend.getNetworkInfo();
};
