import { PROTO } from '@trezor/connect';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { prepareDisplaySymbolFormatter } from '../prepareDisplaySymbolFormatter';

describe('prepareDisplaySymbolFormatter', () => {
    let displaySymbolFormatter: ReturnType<typeof prepareDisplaySymbolFormatter>;

    beforeEach(() => {
        displaySymbolFormatter = prepareDisplaySymbolFormatter({
            coins: [],
            locale: 'en',
            bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN,
            // @ts-expect-error - no need to test it with Intl for now
            intl: {},
        });
    });

    it.each([
        ['bsc', 'BNB'],
        ['arb', 'ETH'],
        ['base', 'ETH'],
        ['btc', 'BTC'],
    ] as [NetworkSymbol, string][])(
        'should display symbolName (#16190) case %#',
        (symbol: NetworkSymbol, expectedValue: string) => {
            expect(displaySymbolFormatter.format(symbol, {})).toBe(expectedValue);
        },
    );
});
