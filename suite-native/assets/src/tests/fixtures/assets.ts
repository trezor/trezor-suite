import BigNumber from 'bignumber.js';

import { networks } from '@suite-common/wallet-config';

import { AssetType } from '../../assetsSelectors';

export const assetsFixtureZeroBalance: AssetType[] = [
    {
        symbol: 'btc',
        network: networks.btc,
        assetBalance: BigNumber(0),
        fiatBalance: '0.00',
    },
    {
        symbol: 'eth',
        network: networks.eth,
        assetBalance: BigNumber(0),
        fiatBalance: '0.00',
    },
    {
        symbol: 'ltc',
        network: networks.ltc,
        assetBalance: BigNumber(0),
        fiatBalance: '0.00',
    },
];

export const assetsFixtureWithBalance: AssetType[] = [
    {
        symbol: 'btc',
        network: networks.btc,
        assetBalance: BigNumber(0.00569722),
        fiatBalance: '98.26',
    },
    {
        symbol: 'eth',
        network: networks.eth,
        assetBalance: BigNumber(0.02142776807619),
        fiatBalance: '28.25',
    },
    {
        symbol: 'ltc',
        network: networks.ltc,
        assetBalance: BigNumber(0),
        fiatBalance: '0.00',
    },
];

export const assetsFixtureSingleAsset: AssetType[] = [
    {
        symbol: 'btc',
        network: networks.btc,
        assetBalance: BigNumber(0.00569722),
        fiatBalance: '98.26',
    },
];

// TODO(vl): add solana asset tests
