import { mockNetworkConfigDeps } from '@suite-common/wallet-config/mocks';

import { getTokensFixtures, hasVisibleTokensFixtures } from './__fixtures__/tokenUtils';
import { getTokens, hasVisibleTokens } from './tokenUtils';

describe('getTokens', () => {
    getTokensFixtures.forEach(
        ({ testName, tokens, symbol, coinDefinitions, searchQuery, result }) => {
            test(testName, () => {
                expect(
                    getTokens({
                        ...mockNetworkConfigDeps,
                        tokens,
                        symbol,
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
            expect(
                hasVisibleTokens(mockNetworkConfigDeps, symbol, tokens, tokenDefinitions),
            ).toStrictEqual(result);
        });
    });
});
