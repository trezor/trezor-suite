import type { BlockchainLinkParams } from '@trezor/blockchain-link';

import type { PostMessage } from '../backend/Blockchain';
import { initCoinBackend } from '../backend/BlockchainLink';
import { COIN_PARAMS, type CoinParams, validateParams } from '../utils/validateParams';

export const getContractInfo = async (
    params: CoinParams & BlockchainLinkParams<'getContractInfo'>,
    postMessage: PostMessage,
) => {
    validateParams(params, [...COIN_PARAMS, { name: 'contract', type: 'string', required: true }]);
    const backend = await initCoinBackend(params, postMessage);
    const { contract, currency, protocols } = params;

    return backend.getContractInfo({ contract, currency, protocols });
};
