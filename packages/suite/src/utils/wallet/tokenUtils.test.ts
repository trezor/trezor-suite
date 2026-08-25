import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
    type RatesByKey,
    asTimestamp,
    toTokenAddress,
} from '@suite-common/wallet-types';
import { mockAccountToken } from '@suite-common/wallet-types/mocks';
import { getFiatRateKey } from '@suite-common/wallet-utils';

import { getTokensFixtures, hasVisibleTokensFixtures } from './__fixtures__/tokenUtils';
import {
    enhanceTokensWithRates,
    getTokens,
    hasVisibleTokens,
    sortTokensWithRates,
} from './tokenUtils';

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

describe('enhanceTokensWithRates and sortTokensWithRates', () => {
    const USDT_CONTRACT = toTokenAddress('0xdac17f958d2ee523a2206206994597c13d831ec7');
    const SHIB_CONTRACT = toTokenAddress('0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce');
    const RATELESS_CONTRACT = toTokenAddress('0x2222222222222222222222222222222222222222');

    const createRate = (rate: number) => ({
        rate,
        lastTickerTimestamp: asTimestamp(1_000_000),
        lastSuccessfulFetchTimestamp: asTimestamp(1_000_000),
        isLoading: false,
        error: null,
        ticker: { symbol: 'eth' as NetworkSymbol },
    });

    const fiatRates: RatesByKey = {
        [getFiatRateKey('eth', 'usd', USDT_CONTRACT)]: createRate(1),
        [getFiatRateKey('eth', 'usd', SHIB_CONTRACT)]: createRate(0.00001),
    };

    const createToken = (contract: string, symbol: string, balance: string) =>
        mockAccountToken({ name: symbol, symbol, contract: toTokenAddress(contract), balance });

    const sortTokens = (tokens: Account['tokens']) =>
        enhanceTokensWithRates(tokens, 'usd', 'eth', fiatRates).toSorted(sortTokensWithRates);

    it('sorts by descending fiat value, not by balance', () => {
        const sorted = sortTokens([
            createToken(SHIB_CONTRACT, 'SHIB', '1000'),
            createToken(USDT_CONTRACT, 'USDT', '20'),
        ]);

        expect(sorted.map(token => token.symbol)).toEqual(['USDT', 'SHIB']);
    });

    it('values a token by its balance times its rate', () => {
        const sorted = sortTokens([createToken(SHIB_CONTRACT, 'SHIB', '1000')]);

        expect(sorted.map(token => token.fiatValue.toNumber())).toEqual([0.01]);
    });

    it('leaves a token without a rate worth nothing and sorts it last', () => {
        const sorted = sortTokens([
            createToken(RATELESS_CONTRACT, 'RATELESS', '1000'),
            createToken(USDT_CONTRACT, 'USDT', '20'),
        ]);

        expect(sorted.map(token => [token.symbol, token.fiatValue.toNumber()])).toEqual([
            ['USDT', 20],
            ['RATELESS', 0],
        ]);
    });

    it('values nothing when no rates are given at all', () => {
        const enhanced = enhanceTokensWithRates(
            [createToken(USDT_CONTRACT, 'USDT', '20')],
            'usd',
            'eth',
        );

        expect(enhanced.map(token => token.fiatValue.toNumber())).toEqual([0]);
    });

    it('leaves the given tokens in their original order', () => {
        const tokens = [
            createToken(SHIB_CONTRACT, 'SHIB', '1000'),
            createToken(USDT_CONTRACT, 'USDT', '20'),
        ];

        sortTokens(tokens);

        expect(tokens.map(token => token.symbol)).toEqual(['SHIB', 'USDT']);
    });

    it('returns nothing for an account without tokens', () => {
        expect(sortTokens(undefined)).toEqual([]);
        expect(sortTokens([])).toEqual([]);
    });
});
