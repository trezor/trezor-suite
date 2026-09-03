import type { CryptoId } from 'invity-api';

import { type DeviceReducerState, deviceInitialState } from '@suite-common/device';
import { type MessageSystemState } from '@suite-common/message-system';
import { type NetworkSymbol } from '@suite-common/networks';
import { initialSuiteSyncDataState, initialSuiteSyncState } from '@suite-common/suite-sync';
import {
    type Action,
    type Feature,
    type Message,
    type TrezorDevice,
} from '@suite-common/suite-types';
import {
    type TradeServerEnvironment,
    type TradingCountryCode,
    type TradingRootStateWithDeviceAndAccounts,
    selectTradingProviderMetadata,
} from '@suite-common/trading';
import { type AccountsRootState } from '@suite-common/wallet-core';
import { type Account, type AccountKey, asAccountDescriptor } from '@suite-common/wallet-types';
import { FeatureFlag, featureFlagsInitialState } from '@suite-native/feature-flags';
import { appSettingsInitialState } from '@suite-native/settings';
import {
    btcAsset,
    getBtcAccount,
    getBuyTrade,
    getCardanoAccount,
    getEthAccount,
    getExchangeTrade,
    getInitializedTradingState,
    getSellTrade,
    getWalletState,
} from '@suite-native/trading-fixtures';
import { type TradeableAsset } from '@suite-native/trading-types';
import { type StaticSessionId } from '@trezor/device-utils';
import { BigNumber } from '@trezor/utils';

import { type TradingRootState, tradingInitialState } from '../reducers';
import {
    selectAccountLabelWithNetworkFallback,
    selectAccountsWithTokensToSellSectionListByTradingType,
    selectActiveTradingType,
    selectAmountInBaseFiatCurrency,
    selectEnabledTradingTypes,
    selectIsAmountInputActive,
    selectIsTradingBlacklisted,
    selectIsTradingBuyEnabled,
    selectIsTradingConciergeEnabled,
    selectIsTradingEnabled,
    selectIsTradingExchangeEnabled,
    selectIsTradingSellEnabled,
    selectIsTradingSlip24Enabled,
    selectIsTradingTxSimulationEnabled,
    selectTradeToBeOpened,
    selectTradesToWatchByAccount,
    selectTradingAccountKeyByOrderId,
    selectTradingEnvironment,
    selectTradingProviderConfirmationStatus,
    selectVisibleDeviceAccountsByNetworkSymbolSorted,
} from './commonSelectors';

const supportedCoins: readonly NetworkSymbol[] = ['btc', 'eth', 'base'];

const actionId = 'ActionId_1';
const contentText = 'Content Text';

const messageSystemState: MessageSystemState = {
    config: null,
    currentSequence: 0,
    timestamp: 0,
    validMessages: {
        banner: [],
        context: [],
        modal: [],
        feature: [],
    },
    dismissedMessages: {},
    validExperiments: [],
    configSource: 'remote',
    manuallyAddedMessageIds: {},
    manuallyAddedExperimentIds: {},
};

const getPreloadedState = ({
    buy,
    sell,
    exchange,
    concierge,
    txSimulation,
    blacklist,
    slip24,
    residence,
    countryCode,
}: {
    buy?: boolean;
    sell?: boolean;
    exchange?: boolean;
    concierge?: boolean;
    txSimulation?: boolean;
    blacklist?: boolean;
    slip24?: boolean;
    residence?: boolean;
    countryCode?: TradingCountryCode | undefined;
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
    if (concierge !== undefined) {
        features.push({
            domain: 'trading.concierge',
            flag: concierge,
        });
    }
    if (txSimulation !== undefined) {
        features.push({
            domain: 'trading.txSimulation',
            flag: txSimulation,
        });
    }
    if (blacklist !== undefined) {
        features.push({
            domain: 'trading.restrictions.blacklist',
            flag: blacklist,
        });
    }
    if (slip24 !== undefined) {
        features.push({
            domain: 'trading.slip24',
            flag: slip24,
        });
    }

    return {
        featureFlags: {
            ...featureFlagsInitialState,
            [FeatureFlag.IsTradingResidenceCheckEnabled]: residence ?? false,
        },
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
            configSource: 'local' as const,
            manuallyAddedMessageIds: {},
            manuallyAddedExperimentIds: {},
        },
        wallet: {
            trading: {
                ...tradingInitialState,
                residence: {
                    ...tradingInitialState.residence,
                    country: countryCode,
                },
            },
        },
    };
};

describe('commonSelectors', () => {
    describe('selectTradingEnvironment', () => {
        it('should correctly select trading environment', () => {
            const state = {
                ...tradingInitialState,
                tradingEnvironment: 'staging' as TradeServerEnvironment,
            };

            expect(selectTradingEnvironment({ wallet: { trading: state } })).toBe('staging');
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

        it('should correctly select that exchange is disabled if remote feature is disabled', () => {
            expect(selectIsTradingExchangeEnabled(getPreloadedState({ exchange: false }))).toBe(
                false,
            );
        });

        it('should correctly select that exchange is enabled if remote feature is not set', () => {
            expect(selectIsTradingExchangeEnabled(getPreloadedState({}))).toBe(true);
        });
    });

    describe('selectIsTradingSellEnabled', () => {
        it('should correctly select that sell is enabled if remote feature is enabled', () => {
            expect(selectIsTradingSellEnabled(getPreloadedState({ sell: true }))).toBe(true);
        });

        it('should correctly select that sell is enabled if remote feature is not set', () => {
            expect(selectIsTradingSellEnabled(getPreloadedState({}))).toBe(true);
        });
    });

    describe('selectIsTradingConciergeEnabled', () => {
        it('should correctly select that concierge is enabled if remote feature is enabled', () => {
            expect(selectIsTradingConciergeEnabled(getPreloadedState({ concierge: true }))).toBe(
                true,
            );
        });

        it('should correctly select that concierge is disabled if remote feature is disabled', () => {
            expect(selectIsTradingConciergeEnabled(getPreloadedState({ concierge: false }))).toBe(
                false,
            );
        });

        it('should correctly select that concierge is enabled if remote feature is not set', () => {
            expect(selectIsTradingConciergeEnabled(getPreloadedState({}))).toBe(true);
        });
    });

    describe('selectIsTradingTxSimulationEnabled', () => {
        it('should be enabled when the remote feature is enabled', () => {
            expect(
                selectIsTradingTxSimulationEnabled(
                    getPreloadedState({
                        txSimulation: true,
                    }),
                ),
            ).toBe(true);
        });

        it('should be disabled when the remote feature is disabled', () => {
            expect(
                selectIsTradingTxSimulationEnabled(
                    getPreloadedState({
                        txSimulation: false,
                    }),
                ),
            ).toBe(false);
        });

        it('should default the remote feature to enabled', () => {
            expect(selectIsTradingTxSimulationEnabled(getPreloadedState({}))).toBe(true);
        });
    });

    describe('selectIsTradingSlip24Enabled', () => {
        const getSlip24State = (
            isFeatureFlagEnabled: boolean,
            features: object | undefined = {
                major_version: 2,
                minor_version: 12,
                patch_version: 1,
            },
        ) =>
            ({
                messageSystem: messageSystemState,
                featureFlags: {
                    ...featureFlagsInitialState,
                    [FeatureFlag.IsTradingSlip24Enabled]: isFeatureFlagEnabled,
                },
                device: { selectedDevice: { features } },
                wallet: { trading: tradingInitialState },
            }) as any;

        it('should be enabled when the feature flag is on for a supported network and firmware', () => {
            expect(selectIsTradingSlip24Enabled(getSlip24State(true), getBtcAccount())).toBe(true);
        });

        it('should be disabled when the device firmware is too old', () => {
            const state = getSlip24State(true, {
                major_version: 2,
                minor_version: 12,
                patch_version: 0,
            });

            expect(selectIsTradingSlip24Enabled(state, getBtcAccount())).toBe(false);
        });

        it('should be disabled when the feature flag is off', () => {
            expect(selectIsTradingSlip24Enabled(getSlip24State(false), getBtcAccount())).toBe(
                false,
            );
        });

        it('should be disabled when the message-system feature is disabled', () => {
            const state = {
                ...getSlip24State(true),
                messageSystem: getPreloadedState({ slip24: false }).messageSystem,
            };

            expect(selectIsTradingSlip24Enabled(state, getBtcAccount())).toBe(false);
        });

        it('should be disabled for an unsupported network type', () => {
            expect(selectIsTradingSlip24Enabled(getSlip24State(true), getCardanoAccount())).toBe(
                false,
            );
        });

        it('should be disabled when there is no account', () => {
            expect(selectIsTradingSlip24Enabled(getSlip24State(true), undefined)).toBe(false);
        });
    });

    describe('selectIsTradingEnabled', () => {
        describe('when residence check is disabled', () => {
            it('should correctly select that trading is enabled if one of remote features is enabled', () => {
                expect(selectIsTradingEnabled(getPreloadedState({ sell: true }))).toBe(true);
            });

            it('should correctly select that trading is enabled if no remote feature is set', () => {
                expect(selectIsTradingEnabled(getPreloadedState({}))).toBe(true);
            });

            it('should correctly select that trading is not enabled when buy, exchange, sell and concierge are disabled', () => {
                expect(
                    selectIsTradingEnabled(
                        getPreloadedState({
                            buy: false,
                            exchange: false,
                            sell: false,
                            concierge: false,
                        }),
                    ),
                ).toBe(false);
            });
        });

        describe('when residence check is enabled', () => {
            it('should correctly select that trading is not enabled when country is not set', () => {
                expect(
                    selectIsTradingEnabled(getPreloadedState({ residence: true, buy: true })),
                ).toBe(false);
            });

            it('should correctly select that trading is enabled when country is whitelisted', () => {
                expect(
                    selectIsTradingEnabled(
                        getPreloadedState({ residence: true, buy: true, countryCode: 'CZ' }),
                    ),
                ).toBe(true);
            });
        });
    });

    describe('selectTradeToBeOpened', () => {
        const getMockStateForTradeToBeOpened = (orderId: string | undefined) =>
            ({
                wallet: {
                    trading: {
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

    describe('selectTradingAccountKeyByOrderId', () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
        const sellTrade = getSellTrade({ status: 'SEND_CRYPTO' });
        const exchangeTrade = getExchangeTrade({ status: 'CONVERTING' });
        const state = {
            wallet: {
                trading: {
                    ...tradingInitialState,
                    trades: [buyTrade, sellTrade, exchangeTrade],
                },
            },
        } as TradingRootState;

        it.each([
            [buyTrade.data.orderId, buyTrade.selectedAccountKey],
            [sellTrade.data.orderId, sellTrade.sendAccountKey],
            [exchangeTrade.data.orderId, exchangeTrade.sendAccountKey],
        ])('should select the associated account for order %s', (orderId, accountKey) => {
            expect(selectTradingAccountKeyByOrderId(state, orderId)).toBe(accountKey);
        });

        it('should return undefined for an unknown order', () => {
            expect(selectTradingAccountKeyByOrderId(state, 'unknown-order')).toBeUndefined();
        });
    });

    describe('selectIsAmountInputActive', () => {
        it('should correctly select trading.isAmountInputActive state', () => {
            expect(
                selectIsAmountInputActive({
                    wallet: { trading: { isAmountInputActive: true } as any },
                }),
            ).toBe(true);
        });
    });

    describe('selectActiveTradingType', () => {
        it('should correctly select trading.activeTradingType state', () => {
            expect(
                selectActiveTradingType({
                    wallet: { trading: { activeTradingType: 'exchange' } as any },
                }),
            ).toBe('exchange');
        });
    });

    describe('selectEnabledTradingTypes', () => {
        it.each([
            [
                { buy: true, exchange: true, sell: true, concierge: true },
                ['exchange', 'buy', 'sell', 'concierge'],
            ],
            [
                { buy: true, exchange: false, sell: true, concierge: true },
                ['buy', 'sell', 'concierge'],
            ],
            [{ buy: false, exchange: false, sell: false, concierge: false }, []],
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
                featureFlags: featureFlagsInitialState,
            } as any;

            expect(
                selectAccountsWithTokensToSellSectionListByTradingType(
                    stateWithDevice,
                    'exchange',
                    supportedCoins,
                ),
            ).toEqual([]);
        });

        it('should return sections for accounts with positive balance', () => {
            const testDeviceState: StaticSessionId = 'testDevice@x:0';
            const btcAccount = {
                ...getBtcAccount(),
                visible: true,
                deviceState: testDeviceState,
            };
            const cleanState = getInitializedTradingState('exchange');

            const stateWithDevice = {
                wallet: {
                    trading: cleanState,
                    accounts: [btcAccount],
                    settings: { localCurrency: 'usd', enabledNetworks: ['btc'] },
                    transactions: { transactions: {} },
                },
                device: { selectedDevice: { state: { staticSessionId: testDeviceState } } },
                tokenDefinitions: {},
                fiat: { rates: {}, current: 'usd' },
                featureFlags: featureFlagsInitialState,
            } as any;

            const result = selectAccountsWithTokensToSellSectionListByTradingType(
                stateWithDevice,
                'exchange',
                supportedCoins,
            );

            expect(result.length).toBeGreaterThan(0);
            expect(result[0]).toEqual(
                expect.objectContaining({
                    key: `section_${btcAccount.key}`,
                    label: expect.any(String),
                    sectionData: expect.any(Object),
                    data: expect.any(Array),
                }),
            );
        });

        it('should filter out accounts with zero balance', () => {
            const testDeviceState: StaticSessionId = 'testDevice@x:0';
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
                    trading: cleanState,
                    accounts: [zeroBalanceAccount],
                    settings: { localCurrency: 'usd', enabledNetworks: ['btc'] },
                },
                device: { selectedDevice: { state: { staticSessionId: testDeviceState } } },
                tokenDefinitions: {},
                fiat: { rates: {}, current: 'usd' },
                featureFlags: featureFlagsInitialState,
            } as any;

            expect(
                selectAccountsWithTokensToSellSectionListByTradingType(
                    stateWithDevice,
                    'exchange',
                    supportedCoins,
                ),
            ).toEqual([]);
        });

        it('should handle accounts with tokens and include only tokens with positive balance', () => {
            const testDeviceState: StaticSessionId = 'testDevice@x:0';
            const ethAccount = {
                ...getEthAccount(),
                balance: '1000000000000000000', // 1 ETH
                formattedBalance: '1',
                visible: true,
                deviceState: testDeviceState,
                tokens: [
                    {
                        standard: 'ERC20',
                        name: 'USDC',
                        contract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                        transfers: 1,
                        symbol: 'usdc',
                        decimals: 6,
                        balance: '1000000', // 1 USDC
                    },
                    {
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
                featureFlags: featureFlagsInitialState,
                wallet: {
                    trading: cleanState,
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

            const result = selectAccountsWithTokensToSellSectionListByTradingType(
                stateWithDevice,
                'sell',
                supportedCoins,
            );

            expect(result.length).toBe(1);
            expect(result[0]?.data.length).toBe(2); // Account + 2 tokens with positive balance
            expect(result[0]?.data[0]?.symbol).toBe('eth'); // Account asset
            expect(result[0]?.data[1]?.contract).toBe('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'); // USDC
            expect(result[0]?.data[1]?.isEnabled).toBe(true);
        });

        it('should handle accounts with zero balance but tokens with positive balance', () => {
            const testDeviceState: StaticSessionId = 'testDevice@x:0';
            const ethAccount = {
                ...getEthAccount(),
                balance: '0',
                formattedBalance: '0',
                visible: true,
                deviceState: testDeviceState,
                tokens: [
                    {
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
                featureFlags: featureFlagsInitialState,
                wallet: {
                    trading: cleanState,
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

            const result = selectAccountsWithTokensToSellSectionListByTradingType(
                stateWithDevice,
                'exchange',
                supportedCoins,
            );

            expect(result.length).toBe(1);
            expect(result[0]?.data.length).toBe(1); // Only token, no account asset
            expect(result[0]?.data[0]?.contract).toBe('0x4444444444444444444444444444444444444444');
        });

        it('should filter out sections with no assets', () => {
            const testDeviceState: StaticSessionId = 'testDevice@x:0';
            const ethAccount = {
                ...getEthAccount(),
                balance: '0',
                formattedBalance: '0',
                visible: true,
                deviceState: testDeviceState,
                tokens: [
                    {
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
                featureFlags: featureFlagsInitialState,
                wallet: {
                    trading: cleanState,
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

            const result = selectAccountsWithTokensToSellSectionListByTradingType(
                stateWithDevice,
                'sell',
                supportedCoins,
            );

            expect(result).toEqual([]); // No sections with assets
        });

        it('should handle accounts with missing token definitions', () => {
            const testDeviceState: StaticSessionId = 'testDevice@x:0';
            const ethAccount = {
                ...getEthAccount(),
                balance: '1000000000000000000', // 1 ETH
                formattedBalance: '1',
                visible: true,
                deviceState: testDeviceState,
                tokens: [
                    {
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
                featureFlags: featureFlagsInitialState,
                wallet: {
                    trading: cleanState,
                    accounts: [ethAccount],
                    settings: { localCurrency: 'usd', enabledNetworks: ['eth'] },
                    transactions: { transactions: {} },
                },
                device: { selectedDevice: { state: { staticSessionId: testDeviceState } } },
                tokenDefinitions: {}, // No token definitions
                fiat: { rates: {}, current: 'usd' },
            } as any;

            const result = selectAccountsWithTokensToSellSectionListByTradingType(
                stateWithDevice,
                'exchange',
                supportedCoins,
            );

            expect(result.length).toBe(1);
            expect(result[0]?.data.length).toBe(1); // Only account asset, no tokens
            expect(result[0]?.data[0]?.symbol).toBe('eth');
        });

        it('should return empty array for buy trading type', () => {
            const testDeviceState: StaticSessionId = 'testDevice@x:0';
            const btcAccount = {
                ...getBtcAccount(),
                balance: '100000000', // 1 BTC
                formattedBalance: '1',
                visible: true,
                deviceState: testDeviceState,
            };
            const cleanState = getInitializedTradingState('buy');

            const stateWithDevice = {
                featureFlags: featureFlagsInitialState,
                wallet: {
                    trading: cleanState,
                    accounts: [btcAccount],
                    settings: { localCurrency: 'usd', enabledNetworks: ['btc'] },
                    transactions: { transactions: {} },
                },
                device: { selectedDevice: { state: { staticSessionId: testDeviceState } } },
                tokenDefinitions: {},
                fiat: { rates: {}, current: 'usd' },
            } as any;

            const result = selectAccountsWithTokensToSellSectionListByTradingType(
                stateWithDevice,
                'buy',
                supportedCoins,
            );

            expect(result).toEqual([]);
        });

        it('should return sections for sell trading type', () => {
            const testDeviceState: StaticSessionId = 'testDevice@x:0';
            const btcAccount = {
                ...getBtcAccount(),
                balance: '100000000', // 1 BTC
                formattedBalance: '1',
                visible: true,
                deviceState: testDeviceState,
            };
            const cleanState = getInitializedTradingState('sell');

            const stateWithDevice = {
                featureFlags: featureFlagsInitialState,
                wallet: {
                    trading: cleanState,
                    accounts: [btcAccount],
                    settings: { localCurrency: 'usd', enabledNetworks: ['btc'] },
                    transactions: { transactions: {} },
                },
                device: { selectedDevice: { state: { staticSessionId: testDeviceState } } },
                tokenDefinitions: {},
                fiat: { rates: {}, current: 'usd' },
            } as any;

            const result = selectAccountsWithTokensToSellSectionListByTradingType(
                stateWithDevice,
                'exchange',
                supportedCoins,
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
            expect(result[0]?.data[0]?.symbol).toBe('btc');
        });

        it('should use network display symbol name for account asset name', () => {
            const testDeviceState: StaticSessionId = 'testDevice@x:0';

            const stateWithDevice = {
                featureFlags: featureFlagsInitialState,
                wallet: getWalletState({ tradeType: 'exchange', deviceState: testDeviceState }),
                device: { selectedDevice: { state: { staticSessionId: testDeviceState } } },
                tokenDefinitions: {},
                fiat: { rates: {}, current: 'usd' },
            } as any;

            const result = selectAccountsWithTokensToSellSectionListByTradingType(
                stateWithDevice,
                'exchange',
                supportedCoins,
            );

            const accountAsset = result[3]?.data[0];
            expect(accountAsset?.symbol).toBe('base');
            expect(accountAsset?.name).toBe('Base Ethereum');
        });

        it('should filter out Cardano accounts when IsCardanoSendEnabled feature flag is disabled', () => {
            const testDeviceState: StaticSessionId = 'testDevice@x:0';
            const cardanoAccount = {
                ...getCardanoAccount(),
                visible: true,
                deviceState: testDeviceState,
            };
            const btcAccount = {
                ...getBtcAccount(),
                visible: true,
                deviceState: testDeviceState,
            };
            const cleanState = getInitializedTradingState('exchange');

            const stateWithDevice = {
                wallet: {
                    trading: cleanState,
                    accounts: [cardanoAccount, btcAccount],
                    settings: { localCurrency: 'usd', enabledNetworks: ['ada', 'btc'] },
                    transactions: { transactions: {} },
                },
                device: { selectedDevice: { state: { staticSessionId: testDeviceState } } },
                tokenDefinitions: {},
                fiat: { rates: {}, current: 'usd' },
                featureFlags: {
                    ...featureFlagsInitialState,
                    [FeatureFlag.IsCardanoSendEnabled]: false,
                },
            } as any;

            const result = selectAccountsWithTokensToSellSectionListByTradingType(
                stateWithDevice,
                'exchange',
                supportedCoins,
            );

            expect(result.length).toBe(1);
            expect(result[0]?.sectionData.symbol).toBe('btc');
        });

        it('should filter out accounts whose network has no tradeCryptoId', () => {
            const testDeviceState: StaticSessionId = 'test-device@x:0';
            const regtestAccount = {
                ...getBtcAccount(),
                key: 'regtest-account-1' as AccountKey,
                symbol: 'regtest' as Account['symbol'],
                accountLabel: 'Regtest Account #1',
                balance: '1000000',
                formattedBalance: '0.01',
                networkType: 'bitcoin' as Account['networkType'],
                visible: true,
                deviceState: testDeviceState,
            };
            const btcAccount = {
                ...getBtcAccount(),
                visible: true,
                deviceState: testDeviceState,
            };
            const cleanState = getInitializedTradingState('exchange');

            const stateWithDevice = {
                wallet: {
                    trading: cleanState,
                    accounts: [regtestAccount, btcAccount],
                    settings: { localCurrency: 'usd', enabledNetworks: ['regtest', 'btc'] },
                    transactions: { transactions: {} },
                },
                device: { selectedDevice: { state: { staticSessionId: testDeviceState } } },
                tokenDefinitions: {},
                fiat: { rates: {}, current: 'usd' },
                featureFlags: featureFlagsInitialState,
            } as any;

            const result = selectAccountsWithTokensToSellSectionListByTradingType(
                stateWithDevice,
                'exchange',
                supportedCoins,
            );

            expect(result.length).toBe(1);
            expect(result[0]?.sectionData.symbol).toBe('btc');
        });

        it('should include Cardano accounts when IsCardanoSendEnabled feature flag is enabled', () => {
            const testDeviceState: StaticSessionId = 'testDevice@x:0';
            const cardanoAccount = {
                ...getCardanoAccount(),
                visible: true,
                deviceState: testDeviceState,
            };
            const btcAccount = {
                ...getBtcAccount(),
                visible: true,
                deviceState: testDeviceState,
            };
            const cleanState = getInitializedTradingState('exchange');

            const stateWithDevice = {
                wallet: {
                    trading: cleanState,
                    accounts: [cardanoAccount, btcAccount],
                    settings: { localCurrency: 'usd', enabledNetworks: ['ada', 'btc'] },
                    transactions: { transactions: {} },
                },
                device: { selectedDevice: { state: { staticSessionId: testDeviceState } } },
                tokenDefinitions: {},
                fiat: { rates: {}, current: 'usd' },
                featureFlags: {
                    ...featureFlagsInitialState,
                    [FeatureFlag.IsCardanoSendEnabled]: true,
                },
            } as any;

            const result = selectAccountsWithTokensToSellSectionListByTradingType(
                stateWithDevice,
                'exchange',
                supportedCoins,
            );

            expect(result.length).toBe(2);
            const symbols = result.map(section => section.sectionData.symbol);
            expect(symbols).toContain('btc');
            expect(symbols).toContain('ada');
        });

        it('should handle contractIds as case insensitive', () => {
            const testDeviceState: StaticSessionId = 'testDevice@x:0';
            const ethAccount = {
                ...getEthAccount(),
                balance: '1000000000000000000', // 1 ETH
                formattedBalance: '1',
                visible: true,
                deviceState: testDeviceState,
                tokens: [
                    {
                        standard: 'ERC20',
                        name: 'USDC',
                        contract: '0xA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48',
                        transfers: 1,
                        symbol: 'usdc',
                        decimals: 6,
                        balance: '1000000', // 1 USDC
                    },
                ],
            };
            const cleanState = getInitializedTradingState('exchange');

            const stateWithDevice = {
                featureFlags: featureFlagsInitialState,
                wallet: {
                    trading: cleanState,
                    accounts: [ethAccount],
                    settings: { localCurrency: 'usd', enabledNetworks: ['eth'] },
                    transactions: { transactions: {} },
                },
                device: { selectedDevice: { state: { staticSessionId: testDeviceState } } },
                tokenDefinitions: {
                    eth: {
                        coin: {
                            data: ['0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'],
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
                supportedCoins,
            );

            expect(result.length).toBe(1);
            expect(result[0]?.data.length).toBe(2); // Account + 2 tokens with positive balance
            expect(result[0]?.data[1]?.contract).toBe('0xA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48'); // USDC
            expect(result[0]?.data[1]?.isEnabled).toBe(true);
        });
    });

    describe('non-tradeable assets', () => {
        it('should preserve disabled tokens', () => {
            const testDeviceState: StaticSessionId = 'testDevice@x:0';
            const ethAccount = {
                ...getEthAccount(),
                balance: '1000000000000000000', // 1 ETH
                formattedBalance: '1',
                visible: true,
                deviceState: testDeviceState,
                tokens: [
                    {
                        standard: 'ERC20',
                        name: 'USDC',
                        contract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                        transfers: 1,
                        symbol: 'usdc',
                        decimals: 6,
                        balance: '1000000', // 1 USDC
                    },
                    {
                        standard: 'ERC20',
                        name: 'non tradeable token 1',
                        contract: '0x12123123123123123123123123123123123123',
                        transfers: 0,
                        symbol: '000',
                        decimals: 18,
                        balance: '1000000',
                    },
                    {
                        standard: 'ERC20',
                        name: 'non tradeable token 2',
                        contract: '0xabcabcabcabcabcabcabcabcabcabcabcabcabca',
                        transfers: 0,
                        symbol: 'ABC',
                        decimals: 18,
                        balance: '1000000',
                    },
                ],
            };
            const cleanState = getInitializedTradingState('exchange');

            const stateWithDevice = {
                featureFlags: featureFlagsInitialState,
                wallet: {
                    trading: cleanState,
                    accounts: [ethAccount],
                    settings: { localCurrency: 'usd', enabledNetworks: ['eth'] },
                    transactions: { transactions: {} },
                },
                device: { selectedDevice: { state: { staticSessionId: testDeviceState } } },
                tokenDefinitions: {
                    eth: {
                        coin: {
                            data: [
                                // presented in selectTradingSupportedSymbols
                                '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                                // not presented in selectTradingSupportedSymbols
                                '0x12123123123123123123123123123123123123',
                                '0xabcabcabcabcabcabcabcabcabcabcabcabcabca',
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
                supportedCoins,
            );

            expect(result.length).toBe(1);
            expect(result[0]?.data).toEqual([
                expect.objectContaining({ name: 'Ethereum', isEnabled: true }),
                expect.objectContaining({ name: 'USDC', isEnabled: true }),
                expect.objectContaining({ name: 'non tradeable token 1', isEnabled: false }),
                expect.objectContaining({ name: 'non tradeable token 2', isEnabled: false }),
            ]);
        });

        it('should not display empty disabled section', () => {
            const testDeviceState: StaticSessionId = 'testDevice@x:0';
            const ethAccount = {
                ...getEthAccount(),
                balance: '1000000000000000000', // 1 ETH
                formattedBalance: '1',
                visible: true,
                deviceState: testDeviceState,
                tokens: [
                    {
                        standard: 'ERC20',
                        name: 'USDC',
                        contract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                        transfers: 1,
                        symbol: 'usdc',
                        decimals: 6,
                        balance: '1000000', // 1 USDC
                    },
                ],
            };
            const cleanState = getInitializedTradingState('exchange');

            const stateWithDevice = {
                featureFlags: featureFlagsInitialState,
                wallet: {
                    trading: cleanState,
                    accounts: [ethAccount],
                    settings: { localCurrency: 'usd', enabledNetworks: ['eth'] },
                    transactions: { transactions: {} },
                },
                device: { selectedDevice: { state: { staticSessionId: testDeviceState } } },
                tokenDefinitions: {
                    eth: {
                        coin: {
                            data: [
                                // presented in selectTradingSupportedSymbols
                                '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
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
                supportedCoins,
            );

            expect(result.length).toBe(1);
            expect(result[0]?.data).toEqual([
                expect.objectContaining({ name: 'Ethereum', isEnabled: true }),
                expect.objectContaining({ name: 'USDC', isEnabled: true }),
            ]);
        });
    });

    describe('selectTradesToWatchByAccount', () => {
        const getStateWithTrades = ({ trades = [] }: { trades?: any[] } = {}) =>
            ({
                wallet: {
                    trading: {
                        ...getInitializedTradingState(),
                        trades,
                    },
                    accounts: [
                        {
                            key: 'btc1',
                            symbol: 'btc',
                            deviceState: 'device1@test:123',
                            descriptor: 'btc-descriptor',
                            addresses: { unused: [{ address: 'btc-address' }] },
                            visible: true,
                        },
                        {
                            key: 'eth1',
                            symbol: 'eth',
                            deviceState: 'device1@test:123',
                            descriptor: 'eth-descriptor',
                            addresses: { unused: [{ address: 'eth-address' }] },
                            visible: true,
                        },
                        {
                            key: 'sol1',
                            symbol: 'sol',
                            deviceState: 'device1@test:123',
                            descriptor: 'sol-descriptor',
                            addresses: { unused: [{ address: 'sol-address' }] },
                            visible: true,
                        },
                    ] as any as Account[],
                    selectedAccount: {
                        status: 'none',
                    },
                },
                device: {
                    ...deviceInitialState,
                    selectedDevice: {
                        state: { staticSessionId: 'device1@test:123' },
                    } as TrezorDevice,
                },
            }) as TradingRootStateWithDeviceAndAccounts;

        it('should filter trades that need watching correctly', () => {
            const mockTrades = [
                getBuyTrade({ status: 'SUBMITTED' }), // Should be watched
                getBuyTrade({ status: 'SUCCESS' }), // Should not be watched (final status)
                getExchangeTrade({ status: 'CONVERTING' }), // Should be watched
                getExchangeTrade({ status: 'ERROR' }), // Should not be watched (final status)
            ];
            const tradesWithAccounts = mockTrades.map(trade => ({
                ...trade,
                selectedAccountKey: 'btc1',
            }));
            const state = getStateWithTrades({ trades: tradesWithAccounts });

            const result = selectTradesToWatchByAccount(state);

            expect(result.tradesToWatch).toHaveLength(2);
            expect(result.tradesToWatch[0]?.data.status).toBe('SUBMITTED');
            expect(result.tradesToWatch[1]?.data.status).toBe('CONVERTING');
        });

        it('should group trades by account correctly', () => {
            const mockTrades = [
                getBuyTrade({ status: 'SUBMITTED' }),
                getExchangeTrade({ status: 'CONVERTING' }),
            ];
            const tradesWithAccounts = mockTrades.map((trade, index) => ({
                ...trade,
                selectedAccountKey: index === 0 ? 'btc1' : 'eth1',
            }));
            const state = getStateWithTrades({ trades: tradesWithAccounts });

            const result = selectTradesToWatchByAccount(state);

            expect(result.tradesByAccount).toHaveLength(2);
            expect(result.tradesByAccount[0]?.account.key).toBe('btc1');
            expect(result.tradesByAccount[0]?.trades).toHaveLength(1);
            expect(result.tradesByAccount[1]?.account.key).toBe('eth1');
            expect(result.tradesByAccount[1]?.trades).toHaveLength(1);
        });

        it('should handle trades with undefined status', () => {
            const mockTrades = [
                getBuyTrade({ status: undefined }), // Should not be watched
                getExchangeTrade({ status: 'CONVERTING' }), // Should be watched
            ];
            const tradesWithAccounts = mockTrades.map(trade => ({
                ...trade,
                selectedAccountKey: 'btc1',
            }));
            const state = getStateWithTrades({ trades: tradesWithAccounts });

            const result = selectTradesToWatchByAccount(state);

            expect(result.tradesToWatch).toHaveLength(1);
            expect(result.tradesToWatch[0]?.data.status).toBe('CONVERTING');
        });

        it('should handle trades without account keys', () => {
            const mockTrades = [
                getBuyTrade({ status: 'SUBMITTED' }),
                getExchangeTrade({ status: 'CONVERTING' }),
            ];
            // Remove account keys to test fallback behavior
            const tradesWithoutAccounts = mockTrades.map(trade => ({
                ...trade,
                selectedAccountKey: undefined,
                sendAccountKey: undefined,
            }));
            const state = getStateWithTrades({ trades: tradesWithoutAccounts });

            const result = selectTradesToWatchByAccount(state);

            // Trades without account keys should not be grouped
            expect(result.tradesByAccount).toHaveLength(0);
        });
    });

    describe('selectVisibleDeviceAccountsByNetworkSymbolSorted', () => {
        const eth1Account = getEthAccount({ descriptor: asAccountDescriptor('eth1') });
        const btc0Account = getBtcAccount({
            descriptor: asAccountDescriptor('btc0'),
            deviceState: 'otherDevice@test:123' as StaticSessionId,
        });
        const btc1Account = getBtcAccount({
            descriptor: asAccountDescriptor('btc1'),
            accountType: 'ledger',
        });
        const btc2Account = getBtcAccount({
            descriptor: asAccountDescriptor('btc2'),
            accountType: 'normal',
        });
        const btc3Account = getBtcAccount({
            descriptor: asAccountDescriptor('btc3'),
            accountType: 'segwit',
        });

        const getStateWithAccounts = () => ({
            wallet: {
                ...getWalletState({ tradeType: 'exchange' }),
                accounts: [eth1Account, btc0Account, btc1Account, btc2Account, btc3Account],
            },
            device: {
                ...deviceInitialState,
                selectedDevice: {
                    state: {
                        staticSessionId:
                            'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@448CCE89D32A733A1632F345:0',
                    },
                },
            } as unknown as DeviceReducerState,
        });

        it('should sort accounts by type', () => {
            const result = selectVisibleDeviceAccountsByNetworkSymbolSorted(
                getStateWithAccounts(),
                'btc',
            );

            expect(result).toEqual([
                expect.objectContaining({ key: btc2Account.key }), // normal
                expect.objectContaining({ key: btc3Account.key }), // segwit
                expect.objectContaining({ key: btc1Account.key }), // ledger
            ]);
        });

        it('should be stable', () => {
            const preloadedState = getStateWithAccounts();

            expect(selectVisibleDeviceAccountsByNetworkSymbolSorted(preloadedState, 'btc')).toBe(
                selectVisibleDeviceAccountsByNetworkSymbolSorted(preloadedState, 'btc'),
            );
        });

        it('should be stable even for empty result', () => {
            const preloadedState = getStateWithAccounts();
            preloadedState.wallet.accounts = [];

            expect(selectVisibleDeviceAccountsByNetworkSymbolSorted(preloadedState, 'btc')).toBe(
                selectVisibleDeviceAccountsByNetworkSymbolSorted(preloadedState, 'btc'),
            );
        });
    });

    describe('selectAccountLabelWithNetworkFallback', () => {
        it('should return account label if account exists', () => {
            const eth1Account = getEthAccount();
            expect(
                selectAccountLabelWithNetworkFallback(
                    {
                        wallet: { accounts: [eth1Account] },
                        suiteSyncData: initialSuiteSyncDataState,
                        suiteSync: initialSuiteSyncState,
                        device: deviceInitialState,
                        appSettings: appSettingsInitialState,
                        messageSystem: messageSystemState,
                    },
                    eth1Account.key,
                    'eth' as CryptoId,
                ),
            ).toBe('Ethereum #1');
        });

        it.each([
            ['ethereum', 'Ethereum'],
            ['ethereum--0xdac17f958d2ee523a2206206994597c13d831ec7', 'Ethereum'],
            ['base--0x0000000000000000000000000000000000000000', 'Base'],
        ])(
            'should return network name for %s when account is not found',
            (asset, expectedLabel) => {
                const unknownAccount = getEthAccount({
                    descriptor: asAccountDescriptor('ethaccount2'),
                });
                expect(
                    selectAccountLabelWithNetworkFallback(
                        {
                            wallet: { accounts: [getEthAccount()] },
                            suiteSyncData: initialSuiteSyncDataState,
                            suiteSync: initialSuiteSyncState,
                            device: deviceInitialState,
                            appSettings: appSettingsInitialState,
                            messageSystem: messageSystemState,
                        },
                        unknownAccount.key,
                        asset as CryptoId,
                    ),
                ).toBe(expectedLabel);
            },
        );

        it('should return undefined when neither account nor asset are specified', () => {
            expect(
                selectAccountLabelWithNetworkFallback(
                    {
                        wallet: { accounts: [getEthAccount()] },
                        suiteSyncData: initialSuiteSyncDataState,
                        suiteSync: initialSuiteSyncState,
                        device: deviceInitialState,
                        appSettings: appSettingsInitialState,
                        messageSystem: messageSystemState,
                    },
                    undefined,
                    undefined,
                ),
            ).toBeUndefined();
        });
    });

    describe('selectTradingProviderConfirmationStatus', () => {
        it('should return correct confirmation status for provider', () => {
            const state = {
                wallet: {
                    trading: {
                        providerConfirmationStatus: 'window_closed_with_success',
                    },
                },
            } as TradingRootState;

            const result = selectTradingProviderConfirmationStatus(state);

            expect(result).toBe('window_closed_with_success');
        });
    });

    describe('selectTradingProviderMetadata', () => {
        it('should return currentProviderMetadata', () => {
            const state = {
                wallet: {
                    trading: {
                        currentProviderMetadata: {
                            name: 'TEST_PROVIDER_NAME',
                            companyName: 'TEST_COMPANY_NAME',
                            logo: 'TEST_LOGO',
                            isActive: true,
                        },
                    },
                },
            } as TradingRootState;

            const result = selectTradingProviderMetadata(state);

            expect(result).toEqual({
                name: 'TEST_PROVIDER_NAME',
                companyName: 'TEST_COMPANY_NAME',
                logo: 'TEST_LOGO',
                isActive: true,
            });
        });
    });
});
