import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { PROTO } from '@trezor/connect';

import { useCryptoAmountMaxDecimals } from './useCryptoAmountMaxDecimals';

const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');

const renderUseCryptoAmountMaxDecimals = (
    symbol: NetworkSymbol,
    bitcoinAmountUnit: PROTO.AmountUnit,
) =>
    renderHookWithStoreProvider(() => useCryptoAmountMaxDecimals(symbol, 8), {
        preloadedState: { wallet: { settings: { bitcoinAmountUnit } } },
    });

describe('useCryptoAmountMaxDecimals', () => {
    it('returns decimals when amount is not in sats', async () => {
        const { result } = await renderUseCryptoAmountMaxDecimals(
            btcSymbol,
            PROTO.AmountUnit.BITCOIN,
        );

        expect(result.current).toBe(8);
    });

    it('returns 0 when amount is in sats', async () => {
        const { result } = await renderUseCryptoAmountMaxDecimals(
            btcSymbol,
            PROTO.AmountUnit.SATOSHI,
        );

        expect(result.current).toBe(0);
    });

    it('returns decimals for network without sats unit', async () => {
        const { result } = await renderUseCryptoAmountMaxDecimals(
            ethSymbol,
            PROTO.AmountUnit.SATOSHI,
        );

        expect(result.current).toBe(8);
    });
});
