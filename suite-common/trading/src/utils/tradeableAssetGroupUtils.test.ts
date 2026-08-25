import { type BaseCurrencyAmount, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

import { groupTradeableAssetsByTradability } from './tradeableAssetGroupUtils';

type TestAsset = {
    name: string;
    fiatBalance: BaseCurrencyAmount | null;
    isTradable: boolean;
};

const createAsset = (overrides: Partial<TestAsset> = {}): TestAsset => ({
    name: 'Ethereum',
    fiatBalance: asBaseCurrencyAmount(new BigNumber('5000')),
    isTradable: true,
    ...overrides,
});

const threshold = asBaseCurrencyAmount(new BigNumber('0.1'));

const groupAssets = (assets: TestAsset[], thresholdValue: BaseCurrencyAmount | null = threshold) =>
    groupTradeableAssetsByTradability({
        assets,
        threshold: thresholdValue,
        getFiatBalance: asset => asset.fiatBalance,
        getIsTradable: asset => asset.isTradable,
    });

describe('groupTradeableAssetsByTradability', () => {
    it('keeps a tradable asset above the threshold in the regular list', () => {
        const asset = createAsset();

        expect(groupAssets([asset])).toEqual({
            assets: [asset],
            lowBalanceAssets: [],
            nonTradableAssets: [],
        });
    });

    it('moves a tradable asset below the threshold to low balance', () => {
        const asset = createAsset({ fiatBalance: asBaseCurrencyAmount(new BigNumber('0.09')) });

        expect(groupAssets([asset])).toEqual({
            assets: [],
            lowBalanceAssets: [asset],
            nonTradableAssets: [],
        });
    });

    it('treats a balance exactly at the threshold as regular', () => {
        const asset = createAsset({ fiatBalance: threshold });

        expect(groupAssets([asset]).assets).toEqual([asset]);
    });

    it('marks a non-tradable asset as non-tradable regardless of its balance', () => {
        const richAsset = createAsset({ name: 'Rich', isTradable: false });
        const dustAsset = createAsset({
            name: 'Dust',
            fiatBalance: asBaseCurrencyAmount(new BigNumber('0.01')),
            isTradable: false,
        });

        expect(groupAssets([richAsset, dustAsset])).toEqual({
            assets: [],
            lowBalanceAssets: [],
            nonTradableAssets: [richAsset, dustAsset],
        });
    });

    it('keeps an asset with an unknown fiat balance in the regular list', () => {
        const asset = createAsset({ fiatBalance: null });

        expect(groupAssets([asset]).assets).toEqual([asset]);
    });

    it('keeps every tradable asset in the regular list when the threshold is unknown', () => {
        const dustAsset = createAsset({ fiatBalance: asBaseCurrencyAmount(new BigNumber('0.01')) });

        expect(groupAssets([dustAsset], null).assets).toEqual([dustAsset]);
    });

    it('preserves the incoming order inside each group', () => {
        const firstDustAsset = createAsset({
            name: 'First dust',
            fiatBalance: asBaseCurrencyAmount(new BigNumber('0.01')),
        });
        const secondDustAsset = createAsset({
            name: 'Second dust',
            fiatBalance: asBaseCurrencyAmount(new BigNumber('0.09')),
        });

        expect(groupAssets([secondDustAsset, createAsset(), firstDustAsset])).toEqual({
            assets: [createAsset()],
            lowBalanceAssets: [secondDustAsset, firstDustAsset],
            nonTradableAssets: [],
        });
    });
});
