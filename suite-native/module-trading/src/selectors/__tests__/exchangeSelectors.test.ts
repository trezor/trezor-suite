import type { CryptoId } from 'invity-api';

import { AccountsRootState } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { FeatureFlag, FeatureFlagsRootState } from '@suite-native/feature-flags';

import { getBtcAccount } from '../../__fixtures__/account';
import { exchangeQuotes } from '../../__fixtures__/exchangeQuotes';
import { getWalletState } from '../../__fixtures__/walletState';
import { TradingRootState } from '../../reducers';
import {
    selectExchangeAmountLimits,
    selectExchangeBuyTradeableAssetsSorted,
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
            state.wallet.trading.exchange.tradingAccountKey = 'unknown_account_key';

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
            state.wallet.trading.exchange.receiveAccountKey = 'unknown_account_key';

            expect(selectExchangeSelectedReceiveAccount(state)).toBeUndefined();
        });
    });

    describe('selectExchangeBuyTradeableAssetsSorted', () => {
        it('should select only coins with exchange set to true', () => {
            expect(selectExchangeBuyTradeableAssetsSorted(state)).toEqual([
                expect.objectContaining({ cryptoId: 'bitcoin' }),
                expect.objectContaining({ cryptoId: 'ethereum' }),
                expect.objectContaining({
                    cryptoId: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                }),
            ]);
        });

        it('should sort coins', () => {
            state.wallet.trading.exchange.exchangeInfo!.buyCryptoIds = [
                'bitcoin',
                'ethereum',
                'eos',
                'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                'base--0x0000000000000000000000000000000000000000',
                'ethereum--0xWithoutObjectInCoinsInfo',
            ] as CryptoId[];

            expect(selectExchangeBuyTradeableAssetsSorted(state)).toEqual([
                expect.objectContaining({ cryptoId: 'bitcoin' }),
                expect.objectContaining({ cryptoId: 'ethereum' }),
                expect.objectContaining({
                    cryptoId: 'base--0x0000000000000000000000000000000000000000',
                }),
                expect.objectContaining({
                    cryptoId: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                }),
            ]);
        });

        it('should be stable', () => {
            const first = selectExchangeBuyTradeableAssetsSorted(state);
            const second = selectExchangeBuyTradeableAssetsSorted(state);

            expect(first).toBe(second);
        });

        it('should be empty array when coins are not set', () => {
            state.wallet.trading.info.coins = undefined;

            expect(selectExchangeBuyTradeableAssetsSorted(state)).toEqual([]);
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
                        quoteId: 'mercuryo-fixed-best',
                    }),
                    expect.objectContaining({
                        quoteId: 'mercuryo-fixed-worst',
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

        it('should sort quotes by rate within each group (highest rate first)', () => {
            state.wallet.trading.exchange.quotes = exchangeQuotes;

            const groupedQuotes = selectGroupedExchangeQuotes(state);

            // Fixed quotes should be sorted by rate (highest first)
            expect(groupedQuotes.fixed[0].rate ?? 0).toBeGreaterThan(
                groupedQuotes.fixed[1].rate ?? 0,
            );

            // DEX quotes should be sorted by rate (highest first)
            expect(groupedQuotes.dex[0].rate ?? 0).toBeGreaterThan(groupedQuotes.dex[1].rate ?? 0);
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
