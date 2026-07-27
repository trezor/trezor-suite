import type { CoinInfo } from '@trezor/connect-common';
import { exhaustive } from '@trezor/type-utils';

import { BitcoinFeeLevels } from './BitcoinFeeLevels';
import { EthereumFeeLevels } from './EthereumFeeLevels';
import { MiscFeeLevels } from './MiscFeeLevels';
import type { FeeLevels } from './feeLevelsBase';

const instancesPerCoin: { [shortcut: CoinInfo['shortcut']]: FeeLevels } = {};

const feeLevelsPerTypeFactory = (coinInfo: CoinInfo): FeeLevels => {
    const { type } = coinInfo;

    switch (type) {
        case 'bitcoin':
            return new BitcoinFeeLevels(coinInfo);
        case 'ethereum':
            return new EthereumFeeLevels(coinInfo);
        case 'misc':
            return new MiscFeeLevels(coinInfo);
        default:
            return exhaustive(type);
    }
};

/**
 * Helper to keep a single instance of FeeLevels for each coin
 */
export const getOrInitFeeLevels = (coinInfo: CoinInfo) =>
    (instancesPerCoin[coinInfo.shortcut] ??= feeLevelsPerTypeFactory(coinInfo));
