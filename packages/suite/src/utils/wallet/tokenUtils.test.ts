import { getTokens, hasVisibleTokens } from './tokenUtils';
import { getTokensFixtures, hasVisibleTokensFixtures } from '../../../mocks/mockTokenUtils';

describe('getTokens', () => {
    getTokensFixtures.forEach(
        ({ testName, tokens, symbol, coinDefinitions, searchQuery, result }) => {
            test(testName, () => {
                expect(
                    getTokens({
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
            expect(hasVisibleTokens(symbol, tokens, tokenDefinitions)).toStrictEqual(result);
        });
    });
});
