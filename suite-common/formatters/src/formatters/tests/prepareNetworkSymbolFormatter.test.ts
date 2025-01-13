import { PROTO } from '@trezor/connect';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { prepareNetworkSymbolFormatter } from '../prepareNetworkSymbolFormatter';

describe('prepareNetworkSymbolFormatter', () => {
    let networkSymbolFormatter: ReturnType<typeof prepareNetworkSymbolFormatter>;

    beforeEach(() => {
        networkSymbolFormatter = prepareNetworkSymbolFormatter({
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
            expect(networkSymbolFormatter.format(symbol, {})).toBe(expectedValue);
        },
    );
});
