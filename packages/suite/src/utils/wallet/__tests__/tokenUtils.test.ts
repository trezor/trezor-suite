import { getTokensFixtures } from '../__fixtures__/tokenUtils';
import { getTokens } from '../tokenUtils';

describe('getTokens', () => {
    getTokensFixtures.forEach(
        ({ testName, tokens, symbol, coinDefinitions, searchQuery, result }) => {
            test(testName, () => {
                expect(getTokens(tokens, symbol, coinDefinitions, searchQuery)).toStrictEqual(
                    result,
                );
            });
        },
    );
});
