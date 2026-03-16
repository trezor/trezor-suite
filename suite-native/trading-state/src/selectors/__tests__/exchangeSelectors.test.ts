import type { CryptoId } from 'invity-api';

import { type AccountsRootState } from '@suite-common/wallet-core';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { FeatureFlag, type FeatureFlagsRootState } from '@suite-native/feature-flags';
import { exchangeQuotes, getBtcAccount, getWalletState } from '@suite-native/trading-fixtures';

import { type TradingRootState } from '../../reducers';
import {
    selectExchangeAmountLimits,
    selectExchangeBuyTradeableAssets,
    selectExchangeQuotes,
    selectExchangeSelectedReceiveAccount,
    selectExchangeSelectedSendAccount,
    selectGroupedExchangeQuotes,
    selectTradingExchange,
} from '../exchangeSelectors';

describe('exchangeSelectors', () => {
    let state: TradingRootState & AccountsRootState & FeatureFlagsRootState;

    beforeEach(() => {
        state = {
            wallet: getWalletState({ tradeType: 'exchange' }),
            featureFlags: {
                [FeatureFlag.AreTradingExchangeDexesEnabled]: true,
                [FeatureFlag.AreDebugOnlyNetworksEnabled]: false,
                [FeatureFlag.AreExperimentalOnlyNetworksEnabled]: false,
            } as FeatureFlagsRootState['featureFlags'],
        };
    });

    it('selectTradingExchange should select trading exchange state', () => {
        expect(selectTradingExchange(state)).toEqual(state.wallet.trading.exchange);
    });

    describe('selectExchangeSelectedSendAccount', () => {
        let account: Account;

        beforeEach(() => {
            account = getBtcAccount();
            state.wallet.trading.exchange.tradingAccountKey = account.key;
        });

        it('should be undefined when no tradingAccountKey is defined', () => {
            state.wallet.trading.exchange.tradingAccountKey = undefined;

            expect(selectExchangeSelectedSendAccount(state)).toBeUndefined();
        });

        it('should select receiveAccount and receiveAddress', () => {
            expect(selectExchangeSelectedSendAccount(state)).toEqual(account);
        });

        it('should be stable', () => {
            expect(selectExchangeSelectedSendAccount(state)).toBe(
                selectExchangeSelectedSendAccount(state),
            );
        });

        it('should return undefined when no account with given key exists', () => {
            state.wallet.trading.exchange.tradingAccountKey = 'unknown_account_key' as AccountKey; // Todo: create properly via `createAccountKey()`

            expect(selectExchangeSelectedSendAccount(state)).toBeUndefined();
        });
    });

    describe('selectExchangeSelectedReceiveAccount', () => {
        let account: Account;

        beforeEach(() => {
            account = getBtcAccount();
            state.wallet.trading.exchange.receiveAccountKey = account.key;
            state.wallet.trading.exchange.receiveAddress = account.addresses?.used[0].address;
        });

        it('should be undefined when no receiveAccountKey is defined', () => {
            state.wallet.trading.exchange.receiveAccountKey = undefined;

            expect(selectExchangeSelectedReceiveAccount(state)).toBeUndefined();
        });

        it('should select receiveAccount and receiveAddress', () => {
            expect(selectExchangeSelectedReceiveAccount(state)).toEqual({
                account,
                address: account.addresses?.used[0],
            });
        });

        it('should be stable', () => {
            expect(selectExchangeSelectedReceiveAccount(state)).toBe(
                selectExchangeSelectedReceiveAccount(state),
            );
        });

        it('should return undefined no account with given key exists', () => {
            state.wallet.trading.exchange.receiveAccountKey = 'unknown_account_key' as AccountKey; // Todo: create properly via `createAccountKey()`

            expect(selectExchangeSelectedReceiveAccount(state)).toBeUndefined();
        });
    });

    describe('selectExchangeBuyTradeableAssets', () => {
        it('should select only coins with exchange set to true', () => {
            expect(selectExchangeBuyTradeableAssets(state)).toEqual([
                expect.objectContaining({
                    cryptoId: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                }),
                expect.objectContaining({ cryptoId: 'ethereum' }),
                expect.objectContaining({ cryptoId: 'bitcoin' }),
            ]);
        });

        it('should be stable', () => {
            const first = selectExchangeBuyTradeableAssets(state);
            const second = selectExchangeBuyTradeableAssets(state);

            expect(first).toBe(second);
        });

        it('should be empty array when coins are not set', () => {
            state.wallet.trading.info.coins = undefined;

            expect(selectExchangeBuyTradeableAssets(state)).toEqual([]);
        });

        it('should be empty array when cryptoIds are not set', () => {
            state.wallet.trading.exchange.exchangeInfo = undefined;

            expect(selectExchangeBuyTradeableAssets(state)).toEqual([]);
        });

        it('should filter out forbidden cryptoId', () => {
            const result = selectExchangeBuyTradeableAssets(
                state,
                'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            );
            expect(result).toEqual([
                expect.objectContaining({ cryptoId: 'ethereum' }),
                expect.objectContaining({ cryptoId: 'bitcoin' }),
            ]);
        });

        it('should filter out coins with invalid network symbols', () => {
            // Add a coin with an invalid symbol that doesn't map to a network
            state.wallet.trading.exchange.exchangeInfo!.buyCryptoIds = [
                'ethereum',
                'bitcoin',
                'invalid-crypto-id',
            ] as CryptoId[];
            state.wallet.trading.info.coins = {
                ...state.wallet.trading.info.coins,
                'invalid-crypto-id': {
                    symbol: 'invalid',
                    name: 'Invalid Coin',
                    coingeckoId: 'invalid',
                    services: {
                        buy: true,
                        sell: true,
                        exchange: true,
                    },
                },
            };

            const result = selectExchangeBuyTradeableAssets(state);

            expect(result).toEqual([
                expect.objectContaining({ cryptoId: 'ethereum' }),
                expect.objectContaining({ cryptoId: 'bitcoin' }),
            ]);
            expect(result).not.toContainEqual(
                expect.objectContaining({ cryptoId: 'invalid-crypto-id' }),
            );
        });

        describe.skip('debug-only networks', () => {
            // There are currently no debug only networks. Skipping
        });
    });

    describe('selectExchangeQuotes', () => {
        it('should return exchange.quotes', () => {
            state.wallet.trading.exchange.quotes = exchangeQuotes;

            expect(selectExchangeQuotes(state)).toEqual(exchangeQuotes);
        });
    });

    describe('selectGroupedExchangeQuotes', () => {
        it('should return empty groups when no quotes are specified', () => {
            expect(selectGroupedExchangeQuotes(state)).toEqual({
                fixed: [],
                float: [],
                dex: [],
            });
        });

        it('should group quotes by fixed/float/dex when DEX feature flag is enabled', () => {
            state.wallet.trading.exchange.quotes = exchangeQuotes;

            const groupedQuotes = selectGroupedExchangeQuotes(state);

            expect(groupedQuotes).toEqual({
                fixed: [
                    expect.objectContaining({
                        quoteId: 'mercuryo-fixed-worst',
                    }),
                    expect.objectContaining({
                        quoteId: 'mercuryo-fixed-best',
                    }),
                ],
                float: [
                    expect.objectContaining({
                        quoteId: 'cexdirect-floating',
                    }),
                ],
                dex: [
                    expect.objectContaining({
                        quoteId: 'invity-dex',
                    }),
                    expect.objectContaining({
                        quoteId: 'mercuryo-dex',
                    }),
                    expect.objectContaining({
                        quoteId: '1inch-fusion-plus',
                    }),
                ],
            });
        });

        it('should exclude DEX quotes when DEX feature flag is disabled', () => {
            state.wallet.trading.exchange.quotes = exchangeQuotes;
            state.featureFlags[FeatureFlag.AreTradingExchangeDexesEnabled] = false;

            const groupedQuotes = selectGroupedExchangeQuotes(state);

            expect(groupedQuotes.dex).toEqual([]);
        });

        it('should be stable', () => {
            state.wallet.trading.exchange.quotes = exchangeQuotes;

            expect(selectGroupedExchangeQuotes(state)).toBe(selectGroupedExchangeQuotes(state));
        });
    });

    describe('selectExchangeAmountLimits', () => {
        it('should return amount limits', () => {
            expect(selectExchangeAmountLimits(state)).toEqual({
                currency: 'BTC',
                minCrypto: '0.0001',
                maxCrypto: '50',
            });
        });
    });
});
