import { asNetworkSymbol } from '@suite-common/wallet-config';

import { getTokensFixtures, hasVisibleTokensFixtures } from './__fixtures__/tokenUtils';
import { getTokens, hasVisibleTokens } from './tokenUtils';

describe('getTokens', () => {
    getTokensFixtures.forEach(
        ({ testName, tokens, symbol, coinDefinitions, searchQuery, result }) => {
            test(testName, () => {
                const networkSymbol = asNetworkSymbol(symbol);

                expect(
                    getTokens({
                        tokens,
                        symbol: networkSymbol,
                        tokenDefinitions: coinDefinitions,
                        searchQuery,
                    }),
                ).toStrictEqual(result);
            });
        },
    );
});

describe('hasVisibleTokens', () => {
    hasVisibleTokensFixtures.forEach(({ testName, tokens, symbol, tokenDefinitions, result }) => {
        test(testName, () => {
            const networkSymbol = asNetworkSymbol(symbol);

            expect(hasVisibleTokens(networkSymbol, tokens, tokenDefinitions)).toStrictEqual(result);
        });
    });
});
