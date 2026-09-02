import { asNetworkSymbol } from '@suite-common/wallet-config';
import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { PROTO } from '@trezor/connect';

import { useAmountInputTransformers } from './useAmountInputTransformers';

const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');

const renderUseAmountInputTransformers = (preloadedState: Record<string, unknown>) =>
    renderHookWithStoreProvider(() => useAmountInputTransformers(btcSymbol), { preloadedState });

describe('useAmountInputTransformers', () => {
    describe('cryptoAmountTransformer', () => {
        it('returns decimalTransformer for fiat amount when isAmountInSats is false', async () => {
            const { result } = await renderUseAmountInputTransformers({
                wallet: { settings: { bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN } },
            });

            expect(result.current.cryptoAmountTransformer('123.456')).toBe('123.456');
        });

        it('returns integerTransformer for crypto amount when isAmountInSats is true', async () => {
            const { result } = await renderUseAmountInputTransformers({
                wallet: { settings: { bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI } },
            });

            expect(result.current.cryptoAmountTransformer('123.456')).toBe('123456');
        });

        it('returns decimalTransformer for fiat amount when isAmountInSats is true and network is eth', async () => {
            const { result } = await renderHookWithStoreProvider(
                () => useAmountInputTransformers(ethSymbol),
                {
                    preloadedState: {
                        wallet: {
                            settings: { bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN },
                        },
                    },
                },
            );

            expect(result.current.cryptoAmountTransformer('123.456')).toBe('123.456');
        });
    });

    it('always returns decimalTransformer as fiatAmountTransformer', async () => {
        const { result } = await renderUseAmountInputTransformers({
            wallet: {
                settings: {
                    bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI,
                },
            },
        });

        expect(result.current.fiatAmountTransformer('123.456')).toBe('123.456');
    });

    it('returns integerTransformer for sats as BaseCurrency', async () => {
        const { result } = await renderUseAmountInputTransformers({
            wallet: {
                settings: {
                    bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI,
                    localCurrency: 'btc',
                },
            },
        });

        expect(result.current.fiatAmountTransformer('123.456')).toBe('123456');
    });
});
