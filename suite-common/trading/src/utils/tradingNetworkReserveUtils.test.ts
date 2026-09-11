import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';

import {
    getMaxAmountWithReserve,
    getTradingDexReserve,
    getTradingNetworkReserve,
} from './tradingNetworkReserveUtils';

const BTC_DEX_RESERVE = '0.00002';

describe('getMaxAmountWithReserve', () => {
    it.each([
        { maxAmount: '1.9999', reserve: BTC_DEX_RESERVE, expected: '1.99988' },
        { maxAmount: '1.9999', reserve: undefined, expected: '1.9999' },
        { maxAmount: '0.00001', reserve: BTC_DEX_RESERVE, expected: '0' },
    ])(
        'subtracts the reserve and floors the result at zero: %j',
        ({ maxAmount, reserve, expected }) => {
            expect(getMaxAmountWithReserve({ maxAmount, reserve }).toString()).toBe(expected);
        },
    );
});

describe('getTradingDexReserve', () => {
    it('returns the reserve for an enabled native BTC DEX trade', () => {
        expect(
            getTradingDexReserve({
                symbol: asNetworkSymbol('btc'),
                contractAddress: undefined,
                isDex: true,
                isNetworkReserveEnabled: true,
            }),
        ).toBe(BTC_DEX_RESERVE);
    });

    it.each<{
        description: string;
        symbol?: NetworkSymbol;
        contractAddress?: string;
        isDex: boolean;
        isNetworkReserveEnabled?: boolean;
    }>([
        { description: 'CEX trade', isDex: false },
        { description: 'disabled reserve setting', isDex: true, isNetworkReserveEnabled: false },
        { description: 'token trade', isDex: true, contractAddress: 'token' },
        { description: 'non-BTC network', isDex: true, symbol: asNetworkSymbol('sol') },
        { description: 'BTC testnet', isDex: true, symbol: asNetworkSymbol('test') },
    ])('returns undefined for $description', overrides => {
        expect(
            getTradingDexReserve({
                symbol: overrides.symbol ?? asNetworkSymbol('btc'),
                contractAddress: overrides.contractAddress,
                isDex: overrides.isDex,
                isNetworkReserveEnabled: overrides.isNetworkReserveEnabled ?? true,
            }),
        ).toBeUndefined();
    });
});

describe('getTradingNetworkReserve', () => {
    it('uses the BTC DEX reserve when applicable', () => {
        expect(
            getTradingNetworkReserve({
                symbol: asNetworkSymbol('btc'),
                contractAddress: undefined,
                isDex: true,
                isNetworkReserveEnabled: true,
            }),
        ).toBe(BTC_DEX_RESERVE);
    });

    it('falls back to the native network reserve', () => {
        expect(
            getTradingNetworkReserve({
                symbol: asNetworkSymbol('sol'),
                contractAddress: undefined,
                isDex: true,
                isNetworkReserveEnabled: true,
            }),
        ).toBe('0.003');
    });

    it('returns undefined for BTC outside DEX', () => {
        expect(
            getTradingNetworkReserve({
                symbol: asNetworkSymbol('btc'),
                contractAddress: undefined,
                isDex: false,
                isNetworkReserveEnabled: true,
            }),
        ).toBeUndefined();
    });
});
