import { Action, Feature, Message } from '@suite-common/suite-types';
import { InvityServerEnvironment } from '@suite-common/trading';
import { AccountsRootState } from '@suite-common/wallet-core';
import { featureFlagsInitialState } from '@suite-native/feature-flags';
import { BigNumber } from '@trezor/utils';

import { getBtcAccount, getEthAccount } from '../../__fixtures__/account';
import { btcAsset } from '../../__fixtures__/tradeableAssets';
import { getInitializedTradingState } from '../../__fixtures__/tradingState';
import { getWalletState } from '../../__fixtures__/walletState';
import { TradingRootState, initialState } from '../../reducers';
import { TradeableAsset } from '../../types/general';
import {
    selectAccountsWithTokensToSellSectionListByTradingType,
    selectActiveTradingType,
    selectAmountInBaseFiatCurrency,
    selectEnabledTradingTypes,
    selectIsAmountInputActive,
    selectIsTradingBlacklisted,
    selectIsTradingBuyEnabled,
    selectIsTradingEnabled,
    selectIsTradingExchangeEnabled,
    selectIsTradingSellEnabled,
    selectTradeToBeOpened,
    selectTradingEnvironment,
} from '../commonSelectors';

const actionId = 'ActionId_1';
const contentText = 'Content Text';

const getPreloadedState = ({
    buy,
    sell,
    exchange,
    blacklist,
}: {
    buy?: boolean;
    sell?: boolean;
    exchange?: boolean;
    blacklist?: boolean;
}) => {
    const features: Feature[] = [];
    if (buy !== undefined) {
        features.push({
            domain: 'trading.buy',
            flag: buy,
        });
    }
    if (sell !== undefined) {
        features.push({
            domain: 'trading.sell',
            flag: sell,
        });
    }
    if (exchange !== undefined) {
        features.push({
            domain: 'trading.exchange',
            flag: exchange,
        });
    }
    if (blacklist !== undefined) {
        features.push({
            domain: 'trading.restrictions.blacklist',
            flag: blacklist,
        });
    }

    return {
        featureFlags: featureFlagsInitialState,
        messageSystem: {
            config: {
                version: 1,
                timestamp: '2023-01-01',
                sequence: 1,
                actions: [
                    {
                        message: {
                            id: actionId,
                            priority: 1,
                            dismissible: true,
                            variant: 'info',
                            category: ['feature'],
                            content: {
                                en: contentText,
                                es: contentText,
                                cs: contentText,
                                ru: contentText,
                                ja: contentText,
                                hu: contentText,
                                it: contentText,
                                fr: contentText,
                                de: contentText,
                                tr: contentText,
                                pt: contentText,
                                uk: contentText,
                            },
                            feature: features,
                        } as Message,
                    } as Action,
                ],
                experiments: [],
            },
            currentSequence: 1,
            timestamp: 0,
            validMessages: {
                banner: [],
                context: [],
                modal: [],
                feature: [actionId],
            },
            dismissedMessages: {},
            validExperiments: [],
        },
    };
};

describe('commonSelectors', () => {
    describe('selectTradingEnvironment', () => {
        it('should correctly select trading environment', () => {
            const state = {
                ...initialState,
                tradingEnvironment: 'staging' as InvityServerEnvironment,
            };

            expect(selectTradingEnvironment({ wallet: { tradingNew: state } })).toBe('staging');
        });
    });

    describe('selectIsTradingBuyEnabled', () => {
        it('should correctly select that buy is enabled if remote feature is enabled', () => {
            expect(selectIsTradingBuyEnabled(getPreloadedState({ buy: true }))).toBe(true);
        });

        it('should correctly select that buy is disabled if remote feature is disabled', () => {
            expect(selectIsTradingBuyEnabled(getPreloadedState({ buy: false }))).toBe(false);
        });

        it('should correctly select that buy is enabled if remote feature is not set', () => {
            expect(selectIsTradingBuyEnabled(getPreloadedState({}))).toBe(true);
        });
    });

    describe('selectIsTradingExchangeEnabled', () => {
        it('should correctly select that exchange is enabled if remote feature is enabled', () => {
            expect(selectIsTradingExchangeEnabled(getPreloadedState({ exchange: true }))).toBe(
                true,
            );
        });

        it('should correctly select that exchange is not enabled if remote feature is not enabled', () => {
            expect(selectIsTradingExchangeEnabled(getPreloadedState({}))).toBe(false);
        });
    });

    describe('selectIsTradingSellEnabled', () => {
        it('should correctly select that sell is enabled if remote feature is enabled', () => {
            expect(selectIsTradingSellEnabled(getPreloadedState({ sell: true }))).toBe(true);
        });

        it('should correctly select that sell is not enabled if remote feature is not enabled', () => {
            expect(selectIsTradingSellEnabled(getPreloadedState({}))).toBe(false);
        });
    });

    describe('selectIsTradingEnabled', () => {
        it('should correctly select that trading is enabled if one of remote features is enabled', () => {
            expect(selectIsTradingEnabled(getPreloadedState({ sell: true }))).toBe(true);
        });

        it('should correctly select that trading is enabled if no remote feature is set', () => {
            expect(selectIsTradingEnabled(getPreloadedState({}))).toBe(true);
        });

        it('should correctly select that trading is not enabled when buy is disabled (and other flags are not set)', () => {
            expect(selectIsTradingEnabled(getPreloadedState({ buy: false }))).toBe(false);
        });
    });

    describe('selectTradeToBeOpened', () => {
        const getMockStateForTradeToBeOpened = (orderId: string | undefined) =>
            ({
                wallet: {
                    tradingNew: {
                        tradeOrderIdToBeOpened: orderId,
                        trades: [{ data: { orderId: 'order1' } }, { data: { orderId: 'order2' } }],
                    },
                },
            }) as unknown as TradingRootState;

        it('should return undefined when "tradeOrderIdToBeOpened" is not specified', () => {
            expect(
                selectTradeToBeOpened(getMockStateForTradeToBeOpened(undefined)),
            ).toBeUndefined();
        });

        it('should return undefined when "tradeOrderIdToBeOpened" is not found', () => {
            expect(
                selectTradeToBeOpened(getMockStateForTradeToBeOpened('non-existing-order')),
            ).toBeUndefined();
        });

        it('should return trade with same orderId as "tradeOrderIdToBeOpened"', () => {
            expect(selectTradeToBeOpened(getMockStateForTradeToBeOpened('order1'))).toEqual({
                data: { orderId: 'order1' },
            });
        });
    });

    describe('selectIsAmountInputActive', () => {
        it('should correctly select trading.isAmountInputActive state', () => {
            expect(
                selectIsAmountInputActive({
                    wallet: { tradingNew: { isAmountInputActive: true } as any },
                }),
            ).toBe(true);
        });
    });

    describe('selectActiveTradingType', () => {
        it('should correctly select trading.activeTradingType state', () => {
            expect(
                selectActiveTradingType({
                    wallet: { tradingNew: { activeTradingType: 'exchange' } as any },
                }),
            ).toBe('exchange');
        });
    });

    describe('selectEnabledTradingTypes', () => {
        it.each([
            [{ buy: true, exchange: true, sell: true }, ['buy', 'exchange', 'sell']],
            [{ buy: false, exchange: true, sell: true }, ['exchange', 'sell']],
            [{ buy: false, exchange: false, sell: false }, []],
        ])(
            'should return order array of allowed tradingTypes, case %#',
            (flags, expectedReturn) => {
                expect(selectEnabledTradingTypes(getPreloadedState(flags))).toEqual(expectedReturn);
            },
        );

        it('should be stable', () => {
            const flags = { buy: true, exchange: true, sell: true };
            const firstCall = selectEnabledTradingTypes(getPreloadedState(flags));
            const secondCall = selectEnabledTradingTypes(getPreloadedState(flags));
            expect(firstCall).toBe(secondCall);
        });
    });

    describe('selectIsTradingBlacklisted', () => {
        it('should return true if trading.restrictions.blacklist feature is enabled', () => {
            const state = getPreloadedState({ blacklist: true });
            expect(selectIsTradingBlacklisted(state)).toBe(true);
        });

        it('should return false if trading.restrictions.blacklist feature is disabled', () => {
            const state = getPreloadedState({ blacklist: false });
            expect(selectIsTradingBlacklisted(state)).toBe(false);
        });

        it('should return false if trading.restrictions.blacklist feature is not set', () => {
            const state = getPreloadedState({});
            expect(selectIsTradingBlacklisted(state)).toBe(false);
        });
    });

    describe('selectAmountInBaseFiatCurrency', () => {
        const getStateWithRates = () => ({
            wallet: getWalletState(),
        });

        it('should return undefined when symbol is not recognized', () => {
            expect(
                selectAmountInBaseFiatCurrency(
                    getStateWithRates(),
                    {} as any as TradeableAsset,
                    '100',
                ),
            ).toBeUndefined();
        });

        it('should return undefined when rate is missing', () => {
            const state = getStateWithRates();
            state.wallet.fiat.current = {};

            expect(selectAmountInBaseFiatCurrency(state, btcAsset, '100')).toBeUndefined();
        });

        it('should return rate', () => {
            expect(selectAmountInBaseFiatCurrency(getStateWithRates(), btcAsset, '100')).toEqual(
                new BigNumber('0.1'),
            );
        });

        it('should return undefined for invalid amount', () => {
            expect(
                selectAmountInBaseFiatCurrency(getStateWithRates(), btcAsset, 'not a number'),
            ).toBeUndefined();
        });

        it('should return 0 for zero balance', () => {
            expect(selectAmountInBaseFiatCurrency(getStateWithRates(), btcAsset, '0')).toEqual(
                new BigNumber('0'),
            );
        });
    });

    describe('selectAccountsWithTokensToSellSectionListByTradingType', () => {
        let state: TradingRootState & AccountsRootState;

        beforeEach(() => {
            state = {
                wallet: getWalletState({ tradeType: 'exchange' }),
            };
        });

        it('should return empty array when no accounts', () => {
            const stateWithDevice = {
                ...state,
                device: { selectedDevice: null },
            } as any;

            expect(
                selectAccountsWithTokensToSellSectionListByTradingType(stateWithDevice, 'exchange'),
            ).toEqual([]);
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
                device: {
                    devices: [{ state: { staticSessionId: testDeviceState } }],
                    selectedDevice: testDeviceState,
                },
                tokenDefinitions: {},
                fiat: { rates: {}, current: 'usd' },
            } as any;

            const result = selectAccountsWithTokensToSellSectionListByTradingType(
                stateWithDevice,
                'exchange',
            );

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
                device: {
                    selectedDevice: testDeviceState,
                    devices: [{ state: { staticSessionId: testDeviceState } }],
                },
                tokenDefinitions: {},
                fiat: { rates: {}, current: 'usd' },
            } as any;

            expect(
                selectAccountsWithTokensToSellSectionListByTradingType(stateWithDevice, 'exchange'),
            ).toEqual([]);
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
                device: {
                    selectedDevice: testDeviceState,
                    devices: [{ state: { staticSessionId: testDeviceState } }],
                },
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

            const result = selectAccountsWithTokensToSellSectionListByTradingType(
                stateWithDevice,
                'exchange',
            );

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
                device: {
                    selectedDevice: testDeviceState,
                    devices: [{ state: { staticSessionId: testDeviceState } }],
                },
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

            const result = selectAccountsWithTokensToSellSectionListByTradingType(
                stateWithDevice,
                'exchange',
            );

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
                device: {
                    selectedDevice: testDeviceState,
                    devices: [{ state: { staticSessionId: testDeviceState } }],
                },
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

            const result = selectAccountsWithTokensToSellSectionListByTradingType(
                stateWithDevice,
                'exchange',
            );

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
                device: {
                    selectedDevice: testDeviceState,
                    devices: [{ state: { staticSessionId: testDeviceState } }],
                },
                tokenDefinitions: {}, // No token definitions
                fiat: { rates: {}, current: 'usd' },
            } as any;

            const result = selectAccountsWithTokensToSellSectionListByTradingType(
                stateWithDevice,
                'exchange',
            );

            expect(result.length).toBe(1);
            expect(result[0].data.length).toBe(1); // Only account asset, no tokens
            expect(result[0].data[0].symbol).toBe('eth');
        });

        it('should return empty array for buy trading type', () => {
            const testDeviceState = 'test-device';
            const btcAccount = {
                ...getBtcAccount(),
                balance: '100000000', // 1 BTC
                formattedBalance: '1',
                visible: true,
                deviceState: testDeviceState,
            };
            const cleanState = getInitializedTradingState('buy');

            const stateWithDevice = {
                wallet: {
                    tradingNew: cleanState,
                    accounts: [btcAccount],
                    settings: { localCurrency: 'usd', enabledNetworks: ['btc'] },
                    transactions: { transactions: {} },
                },
                device: {
                    selectedDevice: testDeviceState,
                    devices: [{ state: { staticSessionId: testDeviceState } }],
                },
                tokenDefinitions: {},
                fiat: { rates: {}, current: 'usd' },
            } as any;

            const result = selectAccountsWithTokensToSellSectionListByTradingType(
                stateWithDevice,
                'buy',
            );

            expect(result).toEqual([]);
        });

        it('should return sections for sell trading type', () => {
            const testDeviceState = 'test-device';
            const btcAccount = {
                ...getBtcAccount(),
                balance: '100000000', // 1 BTC
                formattedBalance: '1',
                visible: true,
                deviceState: testDeviceState,
            };
            const cleanState = getInitializedTradingState('sell');

            const stateWithDevice = {
                wallet: {
                    tradingNew: cleanState,
                    accounts: [btcAccount],
                    settings: { localCurrency: 'usd', enabledNetworks: ['btc'] },
                    transactions: { transactions: {} },
                },
                device: {
                    selectedDevice: testDeviceState,
                    devices: [{ state: { staticSessionId: testDeviceState } }],
                },
                tokenDefinitions: {},
                fiat: { rates: {}, current: 'usd' },
            } as any;

            const result = selectAccountsWithTokensToSellSectionListByTradingType(
                stateWithDevice,
                'sell',
            );

            expect(result.length).toBe(1);
            expect(result[0]).toEqual(
                expect.objectContaining({
                    key: expect.stringContaining('section_'),
                    label: expect.any(String),
                    sectionData: expect.any(Object),
                    data: expect.any(Array),
                }),
            );
            expect(result[0].data[0].symbol).toBe('btc');
        });
    });
});
