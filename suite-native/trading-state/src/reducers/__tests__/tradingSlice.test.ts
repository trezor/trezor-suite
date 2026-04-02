import type { PayloadAction } from '@reduxjs/toolkit';
import type { CryptoId } from 'invity-api';

import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import {
    tradingBuyActions,
    tradingExchangeActions,
    tradingSellActions,
} from '@suite-common/trading';
import { type AccountKey } from '@suite-common/wallet-types';
import { tradingInitialState } from '@suite-native/trading-consts';
import { buyQuotes, exchangeQuotes, sellQuotes } from '@suite-native/trading-fixtures';
import { type ProviderConfirmationStatus, type TradingState } from '@suite-native/trading-types';

import { buyActions } from '../buySlice';
import { exchangeActions } from '../exchangeSlice';
import { residenceActions } from '../residenceSlice';
import { sellActions } from '../sellSlice';
import { tradingActions, tradingSlice } from '../tradingSlice';

describe('tradingSlice', () => {
    let tradingReducer: ReturnType<typeof tradingSlice.prepareReducer>;

    beforeEach(() => {
        tradingReducer = tradingSlice.prepareReducer(extraDependenciesCommonMock);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('initial state', () => {
        it('should have correct initial state', () => {
            const state = tradingReducer(undefined, {
                type: 'undefined_action',
            });

            expect(state).toEqual(
                expect.objectContaining({
                    favouriteAssets: {},
                    tradingEnvironment: 'production',
                    isAmountInputActive: false,
                    activeTradingType: undefined,
                    providerConfirmationStatus: 'inactive',
                }),
            );
        });
    });

    describe('tradingEnvironment', () => {
        it('should have production as initial trading environment', () => {
            const state = tradingReducer(undefined, { type: 'undefined_action' });

            expect(state.tradingEnvironment).toBe('production');
        });

        it('should set trading environment', () => {
            const state = tradingReducer(undefined, tradingActions.setTradingEnvironment('dev'));

            expect(state.tradingEnvironment).toBe('dev');
            expect(state.buy).toEqual({
                quotes: [],
                isFromRedirect: false,
                isLoading: false,
            });
        });

        it('should clear buy state', () => {
            const prevState: TradingState = {
                ...tradingInitialState,
                buy: {
                    ...tradingInitialState.buy,
                    tradingAccountKey: 'account-key' as AccountKey, // Todo: create properly via `createAccountKey()`
                    receiveAddress: 'bc1qxyz',
                    quotesRequest: {
                        wantCrypto: true,
                        receiveCurrency: 'btc' as CryptoId,
                        fiatCurrency: 'czk',
                        country: 'CZ',
                    },
                    quotes: buyQuotes,
                    selectedQuote: buyQuotes[0],
                    amountLimits: {
                        currency: 'CZK',
                        minFiat: '100',
                    },
                },
            };

            const state = tradingReducer(prevState, tradingActions.setTradingEnvironment('dev'));

            expect(state.buy).toEqual({
                quotes: [],
                isFromRedirect: false,
                isLoading: false,
            });
        });

        it('should clear sell state', () => {
            const prevState: TradingState = {
                ...tradingInitialState,
                sell: {
                    ...tradingInitialState.sell,
                    quotes: sellQuotes,
                    tradingAccountKey: 'account-key' as AccountKey, // Todo: create properly via `createAccountKey()`
                    quotesRequest: {
                        amountInCrypto: true,
                        cryptoCurrency: 'bitcoin' as CryptoId,
                        fiatStringAmount: '1000',
                        fiatCurrency: 'CZK',
                    },
                    amountLimits: {
                        currency: 'CZK',
                        minFiat: '100',
                    },
                    selectedQuote: sellQuotes[0],
                },
            };

            const state = tradingReducer(prevState, tradingActions.setTradingEnvironment('dev'));

            expect(state.sell).toEqual({
                quotes: [],
                isFromRedirect: false,
                isLoading: false,
                formStep: 'BANK_ACCOUNT',
            });
        });

        it('should clear exchange state', () => {
            const prevState: TradingState = {
                ...tradingInitialState,
                exchange: {
                    ...tradingInitialState.exchange,
                    quotes: exchangeQuotes,
                },
            };

            const state = tradingReducer(prevState, tradingActions.setTradingEnvironment('dev'));

            expect(state.exchange).toEqual({
                quotes: [],
                isFromRedirect: false,
                isLoading: false,
                formStep: 'RECEIVING_ADDRESS',
            });
        });

        it('should clear tradeOrderIdToBeOpened', () => {
            const prevState: TradingState = {
                ...tradingInitialState,
                tradeOrderIdToBeOpened: 'orderId',
            };

            const state = tradingReducer(prevState, tradingActions.setTradingEnvironment('dev'));

            expect(state.tradeOrderIdToBeOpened).toBeUndefined();
        });
    });

    describe('tradingBuy/clearState', () => {
        it('should clear buy state (buySlice action)', () => {
            const initialState = {
                ...tradingInitialState,
                buy: {
                    ...tradingInitialState.buy,
                    quotes: buyQuotes,
                },
            } as TradingState;

            const state = tradingReducer(initialState, buyActions.clearState());

            expect(state.buy.quotes).toEqual([]);
        });

        it('should clear tradeOrderIdToBeOpened', () => {
            const initialState = {
                ...tradingInitialState,
                tradeOrderIdToBeOpened: 'orderId',
            } as TradingState;

            const state = tradingReducer(initialState, buyActions.clearState());

            expect(state.tradeOrderIdToBeOpened).toBeUndefined();
        });
    });

    describe('tradingExchange/clearState', () => {
        it('should clear exchange state (exchangeSlice action)', () => {
            const initialState = {
                ...tradingInitialState,
                exchange: {
                    ...tradingInitialState.exchange,
                    quotes: exchangeQuotes,
                },
            } as TradingState;

            const state = tradingReducer(initialState, exchangeActions.clearState());

            expect(state.exchange.quotes).toEqual([]);
        });

        it('should clear tradeOrderIdToBeOpened', () => {
            const initialState = {
                ...tradingInitialState,
                tradeOrderIdToBeOpened: 'orderId',
            } as TradingState;

            const state = tradingReducer(initialState, exchangeActions.clearState());

            expect(state.tradeOrderIdToBeOpened).toBeUndefined();
        });
    });

    describe('tradingSell/clearState', () => {
        it('should clear sell state (sellSlice action)', () => {
            const initialState = {
                ...tradingInitialState,
                sell: {
                    ...tradingInitialState.sell,
                    quotes: sellQuotes,
                },
            } as TradingState;

            const state = tradingReducer(initialState, sellActions.clearState());

            expect(state.sell.quotes).toEqual([]);
        });

        it('should clear tradeOrderIdToBeOpened', () => {
            const initialState = {
                ...tradingInitialState,
                tradeOrderIdToBeOpened: 'orderId',
            } as TradingState;

            const state = tradingReducer(initialState, sellActions.clearState());

            expect(state.tradeOrderIdToBeOpened).toBeUndefined();
        });
    });

    describe('tradeOrderIdToBeOpened', () => {
        it('should have undefined as initial tradeOrderIdToBeOpened', () => {
            const state = tradingReducer(undefined, { type: 'undefined_action' });

            expect(state.tradeOrderIdToBeOpened).toBeUndefined();
        });

        it('setTradeOrderIdToBeOpened should set tradeOrderIdToBeOpened', () => {
            const state = tradingReducer(
                undefined,
                tradingActions.setTradeOrderIdToBeOpened('orderId'),
            );

            expect(state.tradeOrderIdToBeOpened).toBe('orderId');
        });
    });

    describe('clearTradeOrderIdToBeOpened', () => {
        it('should clear tradeOrderIdToBeOpened', () => {
            const actions = [
                tradingActions.setTradeOrderIdToBeOpened('orderId'),
                tradingActions.clearTradeOrderIdToBeOpened(),
            ];

            const state = actions.reduce(tradingReducer, undefined) as TradingState;

            expect(state.tradeOrderIdToBeOpened).toBeUndefined();
        });
    });

    describe('clearSelectedAccounts', () => {
        it('should clear receiveAddress', () => {
            const prevState: TradingState = {
                ...tradingInitialState,
                buy: {
                    ...tradingInitialState.buy,
                    receiveAddress: 'address',
                },
                exchange: {
                    ...tradingInitialState.exchange,
                    receiveAddress: 'address',
                },
            };

            const state = tradingReducer(prevState, tradingActions.clearSelectedAccounts());

            expect(state.buy.receiveAddress).toBeUndefined();
            expect(state.exchange.receiveAddress).toBeUndefined();
        });

        it('should clear buy.tradingAccountKey and buy.receiveAccountKey', () => {
            const actions = [
                tradingBuyActions.setTradingAccountKey(
                    'account-key' as AccountKey, // Todo: create properly via `createAccountKey()`
                ),
                tradingBuyActions.setReceiveAccountKey('account-key' as AccountKey),
                tradingActions.clearSelectedAccounts(),
            ];

            const state = actions.reduce(tradingReducer, undefined) as TradingState;
            expect(state.buy.tradingAccountKey).toBeUndefined();
            expect(state.buy.receiveAccountKey).toBeUndefined();
        });

        it('should clear exchange.receiveAccountKey and exchange.tradingAccountKey', () => {
            const actions = [
                tradingExchangeActions.setReceiveAccountKey(
                    'account-key' as AccountKey, // Todo: create properly via `createAccountKey()`
                ),
                tradingExchangeActions.setTradingAccountKey(
                    'account-key' as AccountKey, // Todo: create properly via `createAccountKey()`
                ),
                tradingActions.clearSelectedAccounts(),
            ];

            const state = actions.reduce(tradingReducer, undefined) as TradingState;
            expect(state.exchange.receiveAccountKey).toBeUndefined();
            expect(state.exchange.tradingAccountKey).toBeUndefined();
        });

        it('should clear sell.tradingAccountKey', () => {
            const actions = [
                tradingSellActions.setTradingAccountKey(
                    'account-key' as AccountKey, // Todo: create properly via `createAccountKey()`
                ),
                tradingActions.clearSelectedAccounts(),
            ];

            const state = actions.reduce(tradingReducer, undefined) as TradingState;
            expect(state.sell.tradingAccountKey).toBeUndefined();
        });
    });

    describe('setIsAmountInputActive', () => {
        it('should set isAmountInputActive', () => {
            const actions = [tradingActions.setIsAmountInputActive(true)];

            const state = actions.reduce(tradingReducer, undefined) as TradingState;

            expect(state.isAmountInputActive).toBe(true);
        });
    });

    describe('activeTradingType', () => {
        it('setActiveTradingType should set activeTradingType', () => {
            const actions = [
                tradingSlice.actions.setActiveTradingType('exchange'),
                tradingSlice.actions.setActiveTradingType('sell'),
            ];

            const state = actions.reduce(tradingReducer, undefined) as TradingState;

            expect(state.activeTradingType).toBe('sell');
        });

        it('clearActiveTradingType should should set activeTradingType to undefined', () => {
            const actions = [
                tradingSlice.actions.setActiveTradingType('exchange'),
                tradingSlice.actions.clearActiveTradingType(),
            ];

            const state = actions.reduce(tradingReducer, undefined) as TradingState;

            expect(state.activeTradingType).toBe(undefined);
        });
    });

    describe('residence slice', () => {
        it('should handle residence actions', () => {
            const actions = [
                residenceActions.setResidenceCountry('PL'),
                residenceActions.setOnboardingVisited(),
            ];

            const state = actions.reduce(tradingReducer, undefined) as TradingState;

            expect(state).toEqual(
                expect.objectContaining({
                    residence: {
                        country: 'PL',
                        wasOnboardingVisited: true,
                    },
                }),
            );
        });
    });

    describe('providerConfirmationStatus', () => {
        let actions: PayloadAction<ProviderConfirmationStatus>[];

        describe('and status inactive', () => {
            it('should set status to [window_opened]', () => {
                actions = [tradingActions.setProviderConfirmationStatus('window_opened')];

                const state = actions.reduce(tradingReducer, undefined) as TradingState;

                expect(state.providerConfirmationStatus).toBe('window_opened');
            });

            it.each<ProviderConfirmationStatus>([
                'window_closed_incomplete',
                'window_closed_with_success',
                'confirmation_success',
                'confirmation_failed',
            ])('should not allow to set status to [%s]', invalidStatus => {
                actions = [tradingActions.setProviderConfirmationStatus(invalidStatus)];

                const state = actions.reduce(tradingReducer, undefined) as TradingState;

                expect(state.providerConfirmationStatus).toBe('inactive');
            });
        });

        describe('and status is "window_opened"', () => {
            beforeEach(() => {
                actions = [tradingActions.setProviderConfirmationStatus('window_opened')];
            });

            it.each<ProviderConfirmationStatus>([
                'window_closed_incomplete',
                'window_closed_with_success',
                'confirmation_success',
                'inactive',
            ])('should set status to [%s]', newStatus => {
                actions.push(tradingActions.setProviderConfirmationStatus(newStatus));

                const state = actions.reduce(tradingReducer, undefined) as TradingState;

                expect(state.providerConfirmationStatus).toBe(newStatus);
            });

            it.each<ProviderConfirmationStatus>(['confirmation_failed'])(
                'should not allow to set status to [%s]',
                invalidStatus => {
                    actions.push(tradingActions.setProviderConfirmationStatus(invalidStatus));

                    const state = actions.reduce(tradingReducer, undefined) as TradingState;

                    expect(state.providerConfirmationStatus).toBe('window_opened');
                },
            );
        });

        describe('and status is "window_closed_incomplete"', () => {
            beforeEach(() => {
                actions = [
                    tradingActions.setProviderConfirmationStatus('window_opened'),
                    tradingActions.setProviderConfirmationStatus('window_closed_incomplete'),
                ];
            });

            it.each<ProviderConfirmationStatus>([
                'window_closed_with_success',
                'confirmation_success',
                'confirmation_failed',
                'inactive',
            ])('should set status to [%s]', newStatus => {
                actions.push(tradingActions.setProviderConfirmationStatus(newStatus));

                const state = actions.reduce(tradingReducer, undefined) as TradingState;

                expect(state.providerConfirmationStatus).toBe(newStatus);
            });

            it.each<ProviderConfirmationStatus>(['window_opened'])(
                'should not allow to set status to [%s]',
                invalidStatus => {
                    actions.push(tradingActions.setProviderConfirmationStatus(invalidStatus));

                    const state = actions.reduce(tradingReducer, undefined) as TradingState;

                    expect(state.providerConfirmationStatus).toBe('window_closed_incomplete');
                },
            );
        });

        describe('and status is "window_closed_with_success"', () => {
            beforeEach(() => {
                actions = [
                    tradingActions.setProviderConfirmationStatus('window_opened'),
                    tradingActions.setProviderConfirmationStatus('window_closed_with_success'),
                ];
            });

            it.each<ProviderConfirmationStatus>([
                'confirmation_success',
                'confirmation_failed',
                'inactive',
            ])('should set status to [%s]', newStatus => {
                actions.push(tradingActions.setProviderConfirmationStatus(newStatus));

                const state = actions.reduce(tradingReducer, undefined) as TradingState;

                expect(state.providerConfirmationStatus).toBe(newStatus);
            });

            it.each<ProviderConfirmationStatus>(['window_opened', 'window_closed_incomplete'])(
                'should not allow to set status to [%s]',
                invalidStatus => {
                    actions.push(tradingActions.setProviderConfirmationStatus(invalidStatus));

                    const state = actions.reduce(tradingReducer, undefined) as TradingState;

                    expect(state.providerConfirmationStatus).toBe('window_closed_with_success');
                },
            );
        });

        describe('and status is "confirmation_failed"', () => {
            beforeEach(() => {
                actions = [
                    tradingActions.setProviderConfirmationStatus('window_opened'),
                    tradingActions.setProviderConfirmationStatus('window_closed_with_success'),
                    tradingActions.setProviderConfirmationStatus('confirmation_failed'),
                ];
            });

            it.each<ProviderConfirmationStatus>(['confirmation_success', 'inactive'])(
                'should set status to [%s]',
                newStatus => {
                    actions.push(tradingActions.setProviderConfirmationStatus(newStatus));

                    const state = actions.reduce(tradingReducer, undefined) as TradingState;

                    expect(state.providerConfirmationStatus).toBe(newStatus);
                },
            );

            it.each<ProviderConfirmationStatus>([
                'window_opened',
                'window_closed_incomplete',
                'window_closed_with_success',
            ])('should not allow to set status to [%s]', invalidStatus => {
                actions.push(tradingActions.setProviderConfirmationStatus(invalidStatus));

                const state = actions.reduce(tradingReducer, undefined) as TradingState;

                expect(state.providerConfirmationStatus).toBe('confirmation_failed');
            });
        });

        describe('and status is "confirmation_success"', () => {
            beforeEach(() => {
                actions = [
                    tradingActions.setProviderConfirmationStatus('window_opened'),
                    tradingActions.setProviderConfirmationStatus('window_closed_with_success'),
                    tradingActions.setProviderConfirmationStatus('confirmation_success'),
                ];
            });

            it.each<ProviderConfirmationStatus>(['inactive'])(
                'should set status to [%s]',
                newStatus => {
                    actions.push(tradingActions.setProviderConfirmationStatus(newStatus));

                    const state = actions.reduce(tradingReducer, undefined) as TradingState;

                    expect(state.providerConfirmationStatus).toBe(newStatus);
                },
            );

            it.each<ProviderConfirmationStatus>([
                'window_opened',
                'window_closed_incomplete',
                'window_closed_with_success',
                'confirmation_failed',
            ])('should not allow to set status to [%s]', invalidStatus => {
                actions.push(tradingActions.setProviderConfirmationStatus(invalidStatus));

                const state = actions.reduce(tradingReducer, undefined) as TradingState;

                expect(state.providerConfirmationStatus).toBe('confirmation_success');
            });
        });

        describe('and with invalid status', () => {
            it.each<ProviderConfirmationStatus>([
                'window_opened',
                'window_closed_incomplete',
                'window_closed_with_success',
                'confirmation_failed',
                'confirmation_success',
                'inactive',
            ])('should not allow to set status to [%s]', newStatus => {
                const prevState: TradingState = {
                    ...tradingInitialState,
                    providerConfirmationStatus: 'INVALID_STATUS' as ProviderConfirmationStatus,
                };

                const state = tradingReducer(
                    prevState,
                    tradingActions.setProviderConfirmationStatus(newStatus),
                );

                expect(state.providerConfirmationStatus).toBe(newStatus);
            });
        });
    });
});
