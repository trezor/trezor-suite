import { CryptoId } from 'invity-api';

import { AccountsRootState } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';

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
    let state: TradingRootState & AccountsRootState;

    beforeEach(() => {
        state = {
            wallet: getWalletState({ tradeType: 'exchange' }),
        };
    });

    it('selectTradingExchange should select trading exchange state', () => {
        expect(selectTradingExchange(state)).toEqual(state.wallet.tradingNew.exchange);
    });

    describe('selectExchangeSelectedSendAccount', () => {
        let account: Account;

        beforeEach(() => {
            account = getBtcAccount();
            state.wallet.tradingNew.exchange.tradingAccountKey = account.key;
        });

        it('should be undefined when no tradingAccountKey is defined', () => {
            state.wallet.tradingNew.exchange.tradingAccountKey = undefined;

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
            state.wallet.tradingNew.exchange.tradingAccountKey = 'unknown_account_key';

            expect(selectExchangeSelectedSendAccount(state)).toBeUndefined();
        });
    });

    describe('selectExchangeSelectedReceiveAccount', () => {
        let account: Account;

        beforeEach(() => {
            account = getBtcAccount();
            state.wallet.tradingNew.exchange.receiveAccountKey = account.key;
            state.wallet.tradingNew.exchange.receiveAddress = account.addresses?.used[0];
        });

        it('should be undefined when no receiveAccountKey is defined', () => {
            state.wallet.tradingNew.exchange.receiveAccountKey = undefined;

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
            state.wallet.tradingNew.exchange.receiveAccountKey = 'unknown_account_key';

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
            state.wallet.tradingNew.exchange.exchangeInfo!.buyCryptoIds = [
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
            state.wallet.tradingNew.info.coins = undefined;

            expect(selectExchangeBuyTradeableAssetsSorted(state)).toEqual([]);
        });
    });

    describe('selectExchangeQuotes', () => {
        it('should return exchange.quotes', () => {
            state.wallet.tradingNew.exchange.quotes = exchangeQuotes;

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

        it('should group quotes by fixed/float/dex', () => {
            state.wallet.tradingNew.exchange.quotes = exchangeQuotes;

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
                ],
            });
        });

        it('should be stable', () => {
            state.wallet.tradingNew.exchange.quotes = exchangeQuotes;

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
