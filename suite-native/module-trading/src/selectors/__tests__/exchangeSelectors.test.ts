import { CryptoId } from 'invity-api';

import { AccountsRootState } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';

import { getBtcAccount, getEthAccount } from '../../__fixtures__/account';
import { exchangeQuotes } from '../../__fixtures__/exchangeQuotes';
import { getInitializedTradingState } from '../../__fixtures__/tradingState';
import { getWalletState } from '../../__fixtures__/walletState';
import { TradingRootState } from '../../reducers';
import {
    selectExchangeAccountsWithTokensSectionList,
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

    describe('selectExchangeAccountsWithTokensSectionList', () => {
        it('should return empty array when no accounts', () => {
            const stateWithDevice = {
                ...state,
                device: { selectedDevice: null },
            } as any;

            expect(selectExchangeAccountsWithTokensSectionList(stateWithDevice)).toEqual([]);
        });

        it('should return sections for accounts with positive balance', () => {
            const testDeviceState = 'test-device';
            const btcAccount = {
                ...getBtcAccount(),
                visible: true,
                deviceState: testDeviceState,
            };
            const cleanState = getInitializedTradingState('exchange');

            const stateWithDevice = {
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

            const result = selectExchangeAccountsWithTokensSectionList(stateWithDevice);

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

            const stateWithDevice = {
                wallet: {
                    tradingNew: cleanState,
                    accounts: [zeroBalanceAccount],
                    settings: { localCurrency: 'usd', enabledNetworks: ['btc'] },
                },
                device: { selectedDevice: { state: { staticSessionId: testDeviceState } } },
                tokenDefinitions: {},
                fiat: { rates: {}, current: 'usd' },
            } as any;

            expect(selectExchangeAccountsWithTokensSectionList(stateWithDevice)).toEqual([]);
        });

        it('should handle accounts with tokens and include only tokens with positive balance', () => {
            const testDeviceState = 'test-device';
            const ethAccount = {
                ...getEthAccount(),
                balance: '1000000000000000000', // 1 ETH
                formattedBalance: '1',
                visible: true,
                deviceState: testDeviceState,
                tokens: [
                    {
                        type: 'ERC20',
                        standard: 'ERC20',
                        name: 'USDC',
                        contract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                        transfers: 1,
                        symbol: 'usdc',
                        decimals: 6,
                        balance: '1000000', // 1 USDC
                    },
                    {
                        type: 'ERC20',
                        standard: 'ERC20',
                        name: 'Zero Token',
                        contract: '0x0000000000000000000000000000000000000000',
                        transfers: 0,
                        symbol: 'zero',
                        decimals: 18,
                        balance: '0', // Zero balance token
                    },
                ],
            };
            const cleanState = getInitializedTradingState('exchange');

            const stateWithDevice = {
                wallet: {
                    tradingNew: cleanState,
                    accounts: [ethAccount],
                    settings: { localCurrency: 'usd', enabledNetworks: ['eth'] },
                    transactions: { transactions: {} },
                },
                device: { selectedDevice: { state: { staticSessionId: testDeviceState } } },
                tokenDefinitions: {
                    eth: {
                        coin: {
                            data: [
                                '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                                '0x0000000000000000000000000000000000000000',
                            ],
                            error: false,
                            isLoading: false,
                            hide: [],
                            show: [],
                        },
                    },
                },
                fiat: { rates: {}, current: 'usd' },
            } as any;

            const result = selectExchangeAccountsWithTokensSectionList(stateWithDevice);

            expect(result.length).toBe(1);
            expect(result[0].data.length).toBe(2); // Account + 2 tokens with positive balance
            expect(result[0].data[0].symbol).toBe('eth'); // Account asset
            expect(result[0].data[1].contract).toBe('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'); // USDC
        });

        it('should handle accounts with zero balance but tokens with positive balance', () => {
            const testDeviceState = 'test-device';
            const ethAccount = {
                ...getEthAccount(),
                balance: '0',
                formattedBalance: '0',
                visible: true,
                deviceState: testDeviceState,
                tokens: [
                    {
                        type: 'ERC20',
                        standard: 'ERC20',
                        name: 'Token Only',
                        contract: '0x4444444444444444444444444444444444444444',
                        transfers: 1,
                        symbol: 'token',
                        decimals: 18,
                        balance: '1000000000000000000', // 1 token
                    },
                ],
            };
            const cleanState = getInitializedTradingState('exchange');

            const stateWithDevice = {
                wallet: {
                    tradingNew: cleanState,
                    accounts: [ethAccount],
                    settings: { localCurrency: 'usd', enabledNetworks: ['eth'] },
                    transactions: { transactions: {} },
                },
                device: { selectedDevice: { state: { staticSessionId: testDeviceState } } },
                tokenDefinitions: {
                    eth: {
                        coin: {
                            data: ['0x4444444444444444444444444444444444444444'],
                            error: false,
                            isLoading: false,
                            hide: [],
                            show: [],
                        },
                    },
                },
                fiat: { rates: {}, current: 'usd' },
            } as any;

            const result = selectExchangeAccountsWithTokensSectionList(stateWithDevice);

            expect(result.length).toBe(1);
            expect(result[0].data.length).toBe(1); // Only token, no account asset
            expect(result[0].data[0].contract).toBe('0x4444444444444444444444444444444444444444');
        });

        it('should filter out sections with no assets', () => {
            const testDeviceState = 'test-device';
            const ethAccount = {
                ...getEthAccount(),
                balance: '0',
                formattedBalance: '0',
                visible: true,
                deviceState: testDeviceState,
                tokens: [
                    {
                        type: 'ERC20',
                        standard: 'ERC20',
                        name: 'Zero Token',
                        contract: '0x5555555555555555555555555555555555555555',
                        transfers: 0,
                        symbol: 'zero',
                        decimals: 18,
                        balance: '0', // Zero balance
                    },
                ],
            };
            const cleanState = getInitializedTradingState('exchange');

            const stateWithDevice = {
                wallet: {
                    tradingNew: cleanState,
                    accounts: [ethAccount],
                    settings: { localCurrency: 'usd', enabledNetworks: ['eth'] },
                    transactions: { transactions: {} },
                },
                device: { selectedDevice: { state: { staticSessionId: testDeviceState } } },
                tokenDefinitions: {
                    eth: {
                        coin: {
                            data: ['0x5555555555555555555555555555555555555555'],
                            error: false,
                            isLoading: false,
                            hide: [],
                            show: [],
                        },
                    },
                },
                fiat: { rates: {}, current: 'usd' },
            } as any;

            const result = selectExchangeAccountsWithTokensSectionList(stateWithDevice);

            expect(result).toEqual([]); // No sections with assets
        });

        it('should handle accounts with missing token definitions', () => {
            const testDeviceState = 'test-device';
            const ethAccount = {
                ...getEthAccount(),
                balance: '1000000000000000000', // 1 ETH
                formattedBalance: '1',
                visible: true,
                deviceState: testDeviceState,
                tokens: [
                    {
                        type: 'ERC20',
                        standard: 'ERC20',
                        name: 'Unknown Token',
                        contract: '0x6666666666666666666666666666666666666666',
                        transfers: 1,
                        symbol: 'unknown',
                        decimals: 18,
                        balance: '1000000000000000000', // 1 token
                    },
                ],
            };
            const cleanState = getInitializedTradingState('exchange');

            const stateWithDevice = {
                wallet: {
                    tradingNew: cleanState,
                    accounts: [ethAccount],
                    settings: { localCurrency: 'usd', enabledNetworks: ['eth'] },
                    transactions: { transactions: {} },
                },
                device: { selectedDevice: { state: { staticSessionId: testDeviceState } } },
                tokenDefinitions: {}, // No token definitions
                fiat: { rates: {}, current: 'usd' },
            } as any;

            const result = selectExchangeAccountsWithTokensSectionList(stateWithDevice);

            expect(result.length).toBe(1);
            expect(result[0].data.length).toBe(1); // Only account asset, no tokens
            expect(result[0].data[0].symbol).toBe('eth');
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
