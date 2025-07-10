import { CryptoId } from 'invity-api';

import { extraDependenciesMock } from '@suite-common/test-utils';
import { TradingRootState as CommonTradingRootState } from '@suite-common/trading';
import { Account } from '@suite-common/wallet-types';

import { getBtcAccount } from '../../__fixtures__/account';
import { exchangeQuotes } from '../../__fixtures__/exchangeQuotes';
import { getInitializedTradingState } from '../../__fixtures__/tradingState';
import { TradingRootState, TradingState, tradingSlice } from '../../reducers';
import {
    selectExchangeAccountsWithTokensSectionList,
    selectExchangeQuotes,
    selectExchangeSelectedReceiveAccount,
    selectExchangeTradeableAssetsSorted,
    selectGroupedExchangeQuotes,
    selectTradingExchange,
    selectTradingExchangeIsLoading,
} from '../exchangeSelectors';

describe('exchangeSelectors', () => {
    let tradingReducer: ReturnType<typeof tradingSlice.prepareReducer>;
    let prevState: TradingState;

    beforeEach(() => {
        tradingReducer = tradingSlice.prepareReducer(extraDependenciesMock);
        prevState = getInitializedTradingState('exchange');
    });

    it('selectTradingExchange should select trading exchange state', () => {
        expect(selectTradingExchange({ wallet: { tradingNew: prevState } })).toEqual(
            prevState.exchange,
        );
    });

    describe('selectExchangeSelectedReceiveAccount', () => {
        let account: Account;

        beforeEach(() => {
            account = getBtcAccount();
            prevState.exchange.receiveAccountKey = account.key;
            prevState.exchange.receiveAddress = account.addresses?.used[0];
        });

        it('should be undefined when no receiveAccountKey is defined', () => {
            prevState.exchange.receiveAccountKey = undefined;
            const state = {
                wallet: { tradingNew: prevState, accounts: [account] },
            } as unknown as CommonTradingRootState & TradingRootState;

            expect(selectExchangeSelectedReceiveAccount(state)).toBeUndefined();
        });

        it('should select receiveAccount and receiveAddress', () => {
            const state = {
                wallet: { tradingNew: prevState, accounts: [account] },
            } as unknown as CommonTradingRootState & TradingRootState;
            expect(selectExchangeSelectedReceiveAccount(state)).toEqual({
                account,
                address: account.addresses?.used[0],
            });
        });

        it('should be stable', () => {
            const state = {
                wallet: { tradingNew: prevState, accounts: [account] },
            } as unknown as CommonTradingRootState & TradingRootState;
            expect(selectExchangeSelectedReceiveAccount(state)).toBe(
                selectExchangeSelectedReceiveAccount(state),
            );
        });

        it('should throw when no account with given key exists', () => {
            prevState.exchange.receiveAccountKey = 'unknown_account_key';
            const state = {
                wallet: { tradingNew: prevState, accounts: [account] },
            } as unknown as CommonTradingRootState & TradingRootState;

            expect(() => selectExchangeSelectedReceiveAccount(state)).toThrow(
                'Unknown receiveAccountKey: [unknown_account_key]',
            );
        });
    });

    describe('selectExchangeTradeableAssetsSorted', () => {
        it('should select only coins with exchange set to true', () => {
            expect(
                selectExchangeTradeableAssetsSorted({ wallet: { tradingNew: prevState } }),
            ).toEqual([
                expect.objectContaining({ cryptoId: 'bitcoin' }),
                expect.objectContaining({ cryptoId: 'ethereum' }),
                expect.objectContaining({
                    cryptoId: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                }),
            ]);
        });

        it('should sort coins', () => {
            prevState.exchange.exchangeInfo!.buyCryptoIds = [
                'bitcoin',
                'ethereum',
                'eos',
                'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                'base--0x0000000000000000000000000000000000000000',
                'ethereum--0xWithoutObjectInCoinsInfo',
            ] as CryptoId[];

            expect(
                selectExchangeTradeableAssetsSorted({ wallet: { tradingNew: prevState } }),
            ).toEqual([
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
            const first = selectExchangeTradeableAssetsSorted({
                wallet: { tradingNew: prevState },
            });
            const second = selectExchangeTradeableAssetsSorted({
                wallet: { tradingNew: prevState },
            });

            expect(first).toBe(second);
        });

        it('should be empty array when coins are not set', () => {
            prevState = tradingReducer(undefined, { type: 'undefined_action' });

            expect(
                selectExchangeTradeableAssetsSorted({ wallet: { tradingNew: prevState } }),
            ).toEqual([]);
        });
    });

    describe('selectExchangeQuotes', () => {
        it('should return exchange.quotes', () => {
            prevState.exchange.quotes = exchangeQuotes;

            expect(selectExchangeQuotes({ wallet: { tradingNew: prevState } })).toEqual(
                exchangeQuotes,
            );
        });
    });

    describe('selectTradingExchangeIsLoading', () => {
        it('should return exchange.isLoading', () => {
            prevState.exchange.isLoading = true;

            expect(selectTradingExchangeIsLoading({ wallet: { tradingNew: prevState } })).toBe(
                true,
            );
        });
    });

    describe('selectGroupedExchangeQuotes', () => {
        it('should return empty groups when no quotes are specified', () => {
            expect(selectGroupedExchangeQuotes({ wallet: { tradingNew: prevState } })).toEqual({
                fixed: [],
                float: [],
                dex: [],
            });
        });

        it('should group quotes by fixed/float/dex', () => {
            prevState.exchange.quotes = exchangeQuotes;

            const groupedQuotes = selectGroupedExchangeQuotes({
                wallet: { tradingNew: prevState },
            });

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
            prevState.exchange.quotes = exchangeQuotes;
            const rootState = { wallet: { tradingNew: prevState } };

            expect(selectGroupedExchangeQuotes(rootState)).toBe(
                selectGroupedExchangeQuotes(rootState),
            );
        });
    });

    describe('selectExchangeAccountsWithTokensSectionList', () => {
        it('should return empty array when no accounts', () => {
            const cleanState = getInitializedTradingState('exchange');

            const state = {
                wallet: {
                    tradingNew: cleanState,
                    accounts: [],
                    settings: { localCurrency: 'usd', enabledNetworks: [] },
                    transactions: { transactions: {} },
                },
                device: { selectedDevice: null },
                tokenDefinitions: {},
                fiat: { rates: {}, current: 'usd' },
            } as any;

            expect(selectExchangeAccountsWithTokensSectionList(state)).toEqual([]);
        });

        it('should return sections for accounts with positive balance', () => {
            const testDeviceState = 'test-device';
            const btcAccount = {
                ...getBtcAccount(),
                visible: true,
                deviceState: testDeviceState,
            };
            const cleanState = getInitializedTradingState('exchange');

            const state = {
                wallet: {
                    tradingNew: cleanState,
                    accounts: [btcAccount],
                    settings: { localCurrency: 'usd', enabledNetworks: ['btc'] },
                    transactions: { transactions: {} },
                },
                device: { selectedDevice: { state: { staticSessionId: testDeviceState } } },
                tokenDefinitions: {},
                fiat: { rates: {}, current: 'usd' },
            } as any;

            const result = selectExchangeAccountsWithTokensSectionList(state);

            expect(result.length).toBeGreaterThan(0);
            expect(result[0]).toEqual(
                expect.objectContaining({
                    key: expect.stringContaining('section_'),
                    label: expect.any(String),
                    sectionData: expect.any(Object),
                    data: expect.any(Array),
                }),
            );
        });

        it('should filter out accounts with zero balance', () => {
            const testDeviceState = 'test-device';
            const zeroBalanceAccount = {
                ...getBtcAccount(),
                balance: '0',
                formattedBalance: '0',
                visible: true,
                deviceState: testDeviceState,
            };
            const cleanState = getInitializedTradingState('exchange');

            const state = {
                wallet: {
                    tradingNew: cleanState,
                    accounts: [zeroBalanceAccount],
                    settings: { localCurrency: 'usd', enabledNetworks: ['btc'] },
                },
                device: { selectedDevice: { state: { staticSessionId: testDeviceState } } },
                tokenDefinitions: {},
                fiat: { rates: {}, current: 'usd' },
            } as any;

            expect(selectExchangeAccountsWithTokensSectionList(state)).toEqual([]);
        });
    });
});
