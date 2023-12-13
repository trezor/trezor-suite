import { AssetFiatBalance } from '../../utils';

export const assetsFixtureZeroBalance: AssetFiatBalance[] = [
    {
        symbol: 'btc',

        fiatBalance: '0.00',
    },
    {
        symbol: 'eth',
        fiatBalance: '0.00',
    },
    {
        symbol: 'ltc',
        fiatBalance: '0.00',
    },
];

export const assetsFixtureWithBalance: AssetFiatBalance[] = [
    {
        symbol: 'btc',
        fiatBalance: '98.26',
    },
    {
        symbol: 'eth',
        fiatBalance: '28.25',
    },
    {
        symbol: 'ltc',
        fiatBalance: '0.00',
    },
];

export const assetsFixtureSingleAsset: AssetFiatBalance[] = [
    {
        symbol: 'btc',
        fiatBalance: '98.26',
    },
];
