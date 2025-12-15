import { type WalletSettingsRootState } from '@suite-common/wallet-core';
import { PROTO } from '@trezor/connect';
import { type DeepPartial } from '@trezor/type-utils';

import {
    decimalTransformer,
    integerTransformer,
    useAmountInputTransformers,
} from '../useAmountInputTransformers';

let mockState: DeepPartial<WalletSettingsRootState> | undefined;

jest.mock('react-redux', () => ({
    useSelector: (fn: (state: unknown) => unknown) => fn(mockState),
}));

describe('decimalTransformer', () => {
    it.each([
        ['1.23', '1,23'],
        ['1', 'a1a'],
        ['1', '.1'],
        ['1.11', '1.1.1'],
        ['1', '0001'],
        ['0', '0000'],
        ['0.00', '0.00'],
    ])('should return %s for %s input', (expectedValue, inputValue) => {
        expect(decimalTransformer(inputValue)).toEqual(expectedValue);
    });
});

describe('integerTransformer', () => {
    it.each([
        ['123', '1.23'],
        ['1', 'a1a'],
        ['1', '0001'],
        ['0', '0000'],
        ['0', '0.00'],
    ])('should return %s for %s input', (expectedValue, inputValue) => {
        expect(integerTransformer(inputValue)).toEqual(expectedValue);
    });
});

describe('useAmountInputTransformers', () => {
    beforeEach(() => {
        mockState = undefined;
    });

    describe('cryptoAmountTransformer', () => {
        it('returns decimalTransformer for fiat amount when isAmountInSats is false', () => {
            mockState = {
                wallet: { settings: { bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN } },
            };

            const { cryptoAmountTransformer } = useAmountInputTransformers('btc');

            expect(cryptoAmountTransformer('123.456')).toBe('123.456');
        });

        it('returns integerTransformer for crypto amount when isAmountInSats is true', () => {
            mockState = {
                wallet: { settings: { bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI } },
            };

            const { cryptoAmountTransformer } = useAmountInputTransformers('btc');

            expect(cryptoAmountTransformer('123.456')).toBe('123456');
        });

        it('returns decimalTransformer for fiat amount when isAmountInSats is true and network is eth', () => {
            mockState = {
                wallet: { settings: { bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN } },
            };

            const { cryptoAmountTransformer } = useAmountInputTransformers('eth');

            expect(cryptoAmountTransformer('123.456')).toBe('123.456');
        });
    });

    it('always returns decimalTransformer as fiatAmountTransformer', () => {
        mockState = {
            wallet: { settings: { bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI } },
        };

        const { fiatAmountTransformer } = useAmountInputTransformers('btc');

        expect(fiatAmountTransformer('123.456')).toBe('123.456');
    });

    it('returns integerTransformer for sats as BaseCurrency', () => {
        mockState = {
            wallet: {
                settings: {
                    bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI,
                    localCurrency: 'btc',
                },
            },
        };

        const { fiatAmountTransformer } = useAmountInputTransformers('btc');

        expect(fiatAmountTransformer('123.456')).toBe('123456');
    });
});
