import { getBackendCoinInfo } from '../data/coinInfo';
import { validateParams } from '../utils/validateParams';

/** The backend of the coin from coins.json, which a custom one replaces. */
export const getDefaultBackend = (params: { coin: string }) => {
    validateParams(params, [{ name: 'coin', type: 'string', required: true }]);

    return Promise.resolve(getBackendCoinInfo(params.coin).blockchainLink);
};
