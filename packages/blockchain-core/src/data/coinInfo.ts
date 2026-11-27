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

const predefinedShortcuts = new Set(backendCoins.map(({ shortcut }) => shortcut.toLowerCase()));

// Block time (in seconds) of a network registered without a measured one, which happens only when
// its RPC could not serve the blocks to measure it from.
const FALLBACK_CUSTOM_EVM_BLOCK_TIME_SECONDS = 12;

export type RegisterEvmBackendCoinParams = {
    symbol: string;
    name: string;
    rpcUrls: string[];
    blockTimeSeconds?: number;
};

/**
 * Adds (or updates) an EVM network served by plain RPC nodes. A predefined coin can never be
 * replaced, so its symbol is rejected.
 */
export const registerEvmBackendCoin = ({
    symbol,
    name,
    rpcUrls,
    blockTimeSeconds = FALLBACK_CUSTOM_EVM_BLOCK_TIME_SECONDS,
}: RegisterEvmBackendCoinParams): BackendCoinInfo => {
    const shortcut = symbol.toLowerCase();
    if (predefinedShortcuts.has(shortcut)) {
        throw ERRORS.TypedError(
            'Method_InvalidParameter',
            `Symbol ${symbol} is already used by a predefined network`,
        );
    }

    const coinInfo: BackendCoinInfo = {
        type: 'ethereum',
        shortcut: symbol,
        name,
        blockchainLink: { type: 'evm-rpc', url: rpcUrls },
        ...getEthereumFeeLevels({ chain: shortcut, blocktime_seconds: blockTimeSeconds }),
    };

    const existingIndex = backendCoins.findIndex(c => c.shortcut.toLowerCase() === shortcut);
    if (existingIndex === -1) {
        backendCoins.push(coinInfo);
    } else {
        backendCoins[existingIndex] = coinInfo;
    }

    return coinInfo;
};

export const getBackendCoinInfo = (coin: string): BackendCoinInfo => {
    const symbol = coin.toLowerCase();
    const coinInfo = backendCoins.find(({ shortcut }) => shortcut.toLowerCase() === symbol);
    if (!coinInfo) {
        throw ERRORS.TypedError('Method_UnknownCoin');
    }

    return coinInfo;
};
