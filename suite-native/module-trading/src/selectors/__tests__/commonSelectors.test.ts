import { Action, Feature, Message } from '@suite-common/suite-types';
import { InvityServerEnvironment } from '@suite-common/trading';
import { featureFlagsInitialState } from '@suite-native/feature-flags';
import { BigNumber } from '@trezor/utils';

import { btcAsset } from '../../__fixtures__/tradeableAssets';
import { getWalletState } from '../../__fixtures__/walletState';
import { TradingRootState, initialState } from '../../reducers';
import { TradeableAsset } from '../../types/general';
import {
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
});
