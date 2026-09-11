import { type CoinSymbol, coinSymbols, isCoinSymbol } from '@trezor/connect-common';

import { getAllNetworks } from './coinInfo';

describe('data/coinSymbol', () => {
    // Guards `coinSymbols` against drift from the @trezor/connect-data coin definitions: it must
    // equal the set of supported coinInfo shortcuts (lowercased, as the runtime guard compares).
    // Adding/removing a coin in coins.json/coins-eth.json without updating `coinSymbols` fails here.
    it('coinSymbols matches the supported coinInfo shortcuts', () => {
        const fromCoinInfo = new Set(
            getAllNetworks().map(network => network.shortcut.toLowerCase()),
        );

        expect(new Set(coinSymbols)).toEqual(fromCoinInfo);
    });

    it('isCoinSymbol accepts every supported shortcut and narrows to CoinSymbol', () => {
        getAllNetworks().forEach(network => {
            const symbol = network.shortcut.toLowerCase();
            expect(isCoinSymbol(symbol)).toBe(true);

            if (isCoinSymbol(symbol)) {
                const narrowed: CoinSymbol = symbol;
                expect(coinSymbols).toContain(narrowed);
            }
        });
    });

    it('isCoinSymbol rejects unknown and non-canonical (uppercase) values', () => {
        expect(isCoinSymbol('BTC')).toBe(false);
        expect(isCoinSymbol('not-a-coin')).toBe(false);
        expect(isCoinSymbol('')).toBe(false);
    });
});
