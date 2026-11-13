import { assertBackendSupported, findBackend } from '../backend/BlockchainLink';
import { getBackendCoinInfo } from '../data/coinInfo';
import { COIN_PARAMS, type CoinParams, validateParams } from '../utils/validateParams';

export const disconnect = (params: CoinParams) => {
    validateParams(params, COIN_PARAMS);
    const coinInfo = getBackendCoinInfo(params.coin);
    assertBackendSupported(coinInfo);
    findBackend(coinInfo.shortcut, params.identity)?.disconnect();

    return Promise.resolve({ disconnected: true });
};
