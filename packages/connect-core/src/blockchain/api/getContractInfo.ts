
import type { PostMessage } from '@trezor/blockchain-core/src/backend/Blockchain';
import { initCoinBackend } from '@trezor/blockchain-core/src/backend/BlockchainLink';
import type { BlockchainLinkParams } from '@trezor/blockchain-link';

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
