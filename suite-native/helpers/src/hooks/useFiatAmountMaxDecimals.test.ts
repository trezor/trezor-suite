import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { PROTO } from '@trezor/connect';

import { useFiatAmountMaxDecimals } from './useFiatAmountMaxDecimals';

const renderUseFiatAmountMaxDecimals = (localCurrency: string) =>
    renderHookWithStoreProvider(() => useFiatAmountMaxDecimals(2), {
        preloadedState: {
            wallet: { settings: { bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI, localCurrency } },
        },
    });

describe('useFiatAmountMaxDecimals', () => {
    it('returns decimals for fiat base currency', async () => {
        const { result } = await renderUseFiatAmountMaxDecimals('usd');

        expect(result.current).toBe(2);
    });

    it('returns 0 for sats as base currency', async () => {
        const { result } = await renderUseFiatAmountMaxDecimals('btc');

        expect(result.current).toBe(0);
    });
});
