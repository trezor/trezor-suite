import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { PROTO } from '@trezor/connect';

import { useConvertFormValueToBaseUnit } from './useConvertFormValueToBaseUnit';

const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');

describe('useConvertFormValueToBaseUnit', () => {
    const renderUseConvertApiToAppAmount = async (bitcoinAmountUnit: PROTO.AmountUnit) => {
        const preloadedState = { wallet: { settings: { bitcoinAmountUnit } } };

        return await renderHookWithStoreProvider(() => useConvertFormValueToBaseUnit(), {
            preloadedState,
        });
    };

    describe('convertStrToBaseUnit', () => {
        it('should return undefined when amount is undefined', async () => {
            const { result } = await renderUseConvertApiToAppAmount(PROTO.AmountUnit.SATOSHI);

            expect(result.current.convertStrToBaseUnit(undefined, btcSymbol)).toEqual(undefined);
        });

        it.each<[NetworkSymbol, string, string]>([
            [btcSymbol, '1', '1'],
            [ethSymbol, '1', '1'],
        ])(
            'should correctly convert %s with BTC as app unit',
            async (symbol, amountFromApi, expectedAmount) => {
                const { result } = await renderUseConvertApiToAppAmount(PROTO.AmountUnit.BITCOIN);

                expect(result.current.convertStrToBaseUnit(amountFromApi, symbol)).toEqual(
                    expectedAmount,
                );
            },
        );

        it.each<[NetworkSymbol, string, string]>([
            [btcSymbol, '1', '0.00000001'],
            [ethSymbol, '1', '1'],
        ])(
            'should correctly convert %s with SAT as app unit',
            async (symbol, amountFromApi, expectedAmount) => {
                const { result } = await renderUseConvertApiToAppAmount(PROTO.AmountUnit.SATOSHI);

                expect(result.current.convertStrToBaseUnit(amountFromApi, symbol)).toEqual(
                    expectedAmount,
                );
            },
        );
    });

    describe('convertNumberToBaseUnit', () => {
        it('should return undefined when amount is undefined', async () => {
            const { result } = await renderUseConvertApiToAppAmount(PROTO.AmountUnit.SATOSHI);

            expect(result.current.convertNumberToBaseUnit(undefined, btcSymbol)).toEqual(undefined);
        });

        it.each<[NetworkSymbol, number, number]>([
            [btcSymbol, 1, 1],
            [ethSymbol, 1, 1],
        ])(
            'should correctly convert %s with BTC as app unit',
            async (symbol, amountFromApi, expectedAmount) => {
                const { result } = await renderUseConvertApiToAppAmount(PROTO.AmountUnit.BITCOIN);

                expect(result.current.convertNumberToBaseUnit(amountFromApi, symbol)).toEqual(
                    expectedAmount,
                );
            },
        );

        it.each<[NetworkSymbol, number, number]>([
            [btcSymbol, 1, 0.00000001],
            [ethSymbol, 1, 1],
        ])(
            'should correctly convert %s with SAT as app unit',
            async (symbol, amountFromApi, expectedAmount) => {
                const { result } = await renderUseConvertApiToAppAmount(PROTO.AmountUnit.SATOSHI);

                expect(result.current.convertNumberToBaseUnit(amountFromApi, symbol)).toEqual(
                    expectedAmount,
                );
            },
        );
    });
});
