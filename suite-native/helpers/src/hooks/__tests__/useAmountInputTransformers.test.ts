import { type WalletSettingsRootState } from '@suite-common/wallet-core';
import { PROTO } from '@trezor/connect';
import { type DeepPartial } from '@trezor/type-utils';

import { useAmountInputTransformers } from '../useAmountInputTransformers';

let mockState: DeepPartial<WalletSettingsRootState> | undefined;

jest.mock('react-redux', () => ({
    useSelector: (fn: (state: unknown) => unknown) => fn(mockState),
}));

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
