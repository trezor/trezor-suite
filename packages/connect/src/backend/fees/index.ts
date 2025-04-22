import { BitcoinFeeLevels } from './BitcoinFeeLevels';
import { EthereumFeeLevels } from './EthereumFeeLevels';
import { MiscFeeLevels } from './MiscFeeLevels';
import type { BitcoinNetworkInfo, CoinInfo } from '../../types';

const instancesPerCoin: { [shortcut: CoinInfo['shortcut']]: MiscFeeLevels } = {};

const feeLevelsPerTypeFactory = (coinInfo: CoinInfo): MiscFeeLevels => {
    const { type } = coinInfo;

    switch (type) {
        case 'bitcoin':
            return new BitcoinFeeLevels(coinInfo);
        case 'ethereum':
            return new EthereumFeeLevels(coinInfo);
        case 'misc':
        case 'nem':
            return new MiscFeeLevels(coinInfo);
        default: {
            const _unhandledCase: never = type;

            throw new Error(`Unhandled coin type: ${_unhandledCase}`);
        }
    }
};

/**
 * Helper to keep a single instance of FeeLevels for each coin
 */
export const getOrInitFeeLevels = (coinInfo: CoinInfo): MiscFeeLevels => {
    const { shortcut } = coinInfo;
    if (!Object.prototype.hasOwnProperty.call(instancesPerCoin, shortcut)) {
        instancesPerCoin[shortcut] = feeLevelsPerTypeFactory(coinInfo);
    }

    return instancesPerCoin[shortcut];
};

export const getOrInitBitcoinFeeLevels = (coinInfo: BitcoinNetworkInfo) =>
    getOrInitFeeLevels(coinInfo) as BitcoinFeeLevels;
