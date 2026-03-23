import { type NetworkSymbol } from '@suite-common/wallet-config';
import { renderHookWithStoreProvider } from '@suite-native/test-utils';
import { PROTO } from '@trezor/connect';

import { useConvertFormValueToBaseUnit } from '../useConvertFormValueToBaseUnit';

describe('useConvertFormValueToBaseUnit', () => {
    const renderUseConvertApiToAppAmount = (bitcoinAmountUnit: PROTO.AmountUnit) => {
        const preloadedState = { wallet: { settings: { bitcoinAmountUnit } } };

        return renderHookWithStoreProvider(() => useConvertFormValueToBaseUnit(), {
            preloadedState,
        });
    };

    describe('convertStrToBaseUnit', () => {
        it('should return undefined when amount is undefined', () => {
            const { result } = renderUseConvertApiToAppAmount(PROTO.AmountUnit.SATOSHI);

            expect(result.current.convertStrToBaseUnit(undefined, 'btc')).toEqual(undefined);
        });

        it.each<[NetworkSymbol, string, string]>([
            ['btc', '1', '1'],
            ['eth', '1', '1'],
        ])(
            'should correctly convert %s with BTC as app unit',
            (symbol, amountFromApi, expectedAmount) => {
                const { result } = renderUseConvertApiToAppAmount(PROTO.AmountUnit.BITCOIN);

                expect(result.current.convertStrToBaseUnit(amountFromApi, symbol)).toEqual(
                    expectedAmount,
                );
            },
        );

        it.each<[NetworkSymbol, string, string]>([
            ['btc', '1', '0.00000001'],
            ['eth', '1', '1'],
        ])(
            'should correctly convert %s with SAT as app unit',
            (symbol, amountFromApi, expectedAmount) => {
                const { result } = renderUseConvertApiToAppAmount(PROTO.AmountUnit.SATOSHI);

                expect(result.current.convertStrToBaseUnit(amountFromApi, symbol)).toEqual(
                    expectedAmount,
                );
            },
        );
    });

    describe('convertNumberToBaseUnit', () => {
        it('should return undefined when amount is undefined', () => {
            const { result } = renderUseConvertApiToAppAmount(PROTO.AmountUnit.SATOSHI);

            expect(result.current.convertNumberToBaseUnit(undefined, 'btc')).toEqual(undefined);
        });

        it.each<[NetworkSymbol, number, number]>([
            ['btc', 1, 1],
            ['eth', 1, 1],
        ])(
            'should correctly convert %s with BTC as app unit',
            (symbol, amountFromApi, expectedAmount) => {
                const { result } = renderUseConvertApiToAppAmount(PROTO.AmountUnit.BITCOIN);

                expect(result.current.convertNumberToBaseUnit(amountFromApi, symbol)).toEqual(
                    expectedAmount,
                );
            },
        );

        it.each<[NetworkSymbol, number, number]>([
            ['btc', 1, 0.00000001],
            ['eth', 1, 1],
        ])(
            'should correctly convert %s with SAT as app unit',
            (symbol, amountFromApi, expectedAmount) => {
                const { result } = renderUseConvertApiToAppAmount(PROTO.AmountUnit.SATOSHI);

                expect(result.current.convertNumberToBaseUnit(amountFromApi, symbol)).toEqual(
                    expectedAmount,
                );
            },
        );
    });
});
