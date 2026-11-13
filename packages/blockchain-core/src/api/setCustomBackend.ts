import { reconnectAllBackends, setCustomBackend as setCustom } from '../backend/BlockchainLink';
import { type BlockchainLinkSettings, getBackendCoinInfo } from '../data/coinInfo';
import { validateParams } from '../utils/validateParams';

export type SetCustomBackendParams = { coin: string; blockchainLink?: BlockchainLinkSettings };

export const setCustomBackend = async (params: SetCustomBackendParams) => {
    validateParams(params, [
        { name: 'coin', type: 'string', required: true },
        { name: 'blockchainLink', type: 'object' },
    ]);
    const coinInfo = getBackendCoinInfo(params.coin);
    setCustom(coinInfo, params.blockchainLink);
    await reconnectAllBackends(coinInfo);

    return true;
};
