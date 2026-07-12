import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

import { type AssetFiatBalance } from '../../utils';

export const assetsFixtureZeroBalance: AssetFiatBalance[] = [
    {
        symbol: 'btc',

        fiatBalance: asBaseCurrencyAmount(new BigNumber('0.00')),
    },
    {
        symbol: 'eth',
        fiatBalance: asBaseCurrencyAmount(new BigNumber('0.00')),
    },
    {
        symbol: 'ltc',
        fiatBalance: asBaseCurrencyAmount(new BigNumber('0.00')),
    },
];

export const assetsFixtureWithBalance: AssetFiatBalance[] = [
    {
        symbol: 'btc',
        fiatBalance: asBaseCurrencyAmount(new BigNumber('98.26')),
    },
    {
        symbol: 'eth',
        fiatBalance: asBaseCurrencyAmount(new BigNumber('28.25')),
    },
    {
        symbol: 'ltc',
        fiatBalance: asBaseCurrencyAmount(new BigNumber('0.00')),
    },
];

export const assetsFixtureSingleAsset: AssetFiatBalance[] = [
    {
        symbol: 'btc',
        fiatBalance: asBaseCurrencyAmount(new BigNumber('98.26')),
    },
];

// A NaN fiat balance must not poison the total nor produce a NaN percentage for itself
// or for the other (valid) assets.
export const assetsFixtureWithNaNBalance: AssetFiatBalance[] = [
    {
        symbol: 'btc',
        fiatBalance: asBaseCurrencyAmount(new BigNumber(NaN)),
    },
    {
        symbol: 'eth',
        fiatBalance: asBaseCurrencyAmount(new BigNumber('50')),
    },
];
