import { btcAsset, ethAsset, usdcAsset } from '@suite-native/trading-fixtures';
import { type TradeableAsset } from '@suite-native/trading-types';

import { getBuyCryptoValueDecimals } from './buyAmountUtils';

describe('getBuyCryptoValueDecimals', () => {
    const usdcWithoutDecimals: TradeableAsset = { ...usdcAsset, decimals: undefined };

    it.each([
        ['undefined asset', undefined, undefined],
        ['native asset', btcAsset, 8],
        ['native asset with more decimals than the input accepts', ethAsset, 9],
        ['token', usdcAsset, 6],
        ['token without decimals using capped network decimals', usdcWithoutDecimals, 9],
    ])('should return decimals for %s', (_, asset, expectedDecimals) => {
        expect(getBuyCryptoValueDecimals(asset)).toBe(expectedDecimals);
    });
});
