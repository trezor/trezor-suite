import { ERRORS } from '@trezor/connect-common/src/constants';
import coinsEth from '@trezor/connect-data/files/coins-eth.json';
import coins from '@trezor/connect-data/files/coins.json';

import {
    type FeeInfoWithLevels,
    getBitcoinFeeLevels,
    getEthereumFeeLevels,
    getMiscFeeLevels,
} from './defaultFeeLevels';

export type BlockchainLinkSettings = { type: string; url: string[] };

/** What the backends need to know about a coin: its default backend and its fee limits. */
export type BackendCoinInfo = FeeInfoWithLevels & {
    type: 'bitcoin' | 'ethereum' | 'misc';
    shortcut: string;
    name: string;
    blockchainLink?: BlockchainLinkSettings;
};

const parseCoins = (
    type: BackendCoinInfo['type'],
    json: Record<string, any>[],
    getFeeLevels: (coin: any) => FeeInfoWithLevels,
): BackendCoinInfo[] =>
    json.map(coin => ({
        type,
        shortcut: coin.coin_shortcut ?? coin.shortcut,
        name: coin.coin_name ?? coin.name,
        blockchainLink: coin.blockchain_link,
        ...getFeeLevels(coin),
    }));

const backendCoins = [
    ...parseCoins('bitcoin', coins.bitcoin, getBitcoinFeeLevels),
    ...parseCoins('ethereum', coinsEth.eth, getEthereumFeeLevels),
    ...parseCoins('misc', coins.misc, getMiscFeeLevels),
];

export const getBackendCoinInfo = (coin: string): BackendCoinInfo => {
    const symbol = coin.toLowerCase();
    const coinInfo = backendCoins.find(({ shortcut }) => shortcut.toLowerCase() === symbol);
    if (!coinInfo) {
        throw ERRORS.TypedError('Method_UnknownCoin');
    }

    return coinInfo;
};
