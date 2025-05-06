import { combineReducers } from '@reduxjs/toolkit';
import { CryptoId } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { TrezorDevice } from '@suite-common/suite-types';
import { configureMockStore, extraDependenciesMock } from '@suite-common/test-utils';
import { Account } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';

import { exchangeThunks } from '../../';
import { MIN_MAX_QUOTES_OK } from '../../../__fixtures__/exchangeUtils';
import { accountEth } from '../../../__fixtures__/utils';
import { invityAPI } from '../../../invityAPI';
import { TradingExchangeState } from '../../../reducers/exchangeReducer';
import { initialState, prepareTradingReducer } from '../../../reducers/tradingReducer';

const tradingReducer = prepareTradingReducer(extraDependenciesMock);

describe('signDataAndConfirmThunk', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    jest.mock('../../../invityAPI');

    invityAPI.setInvityServersEnvironment = () => {};
    invityAPI.createInvityAPIKey = () => {};

    const getMocks = (initialExchangeState?: Partial<TradingExchangeState>) => {
        const quoteNotTyped = MIN_MAX_QUOTES_OK[0];
        const quote = {
            ...quoteNotTyped,
            send: quoteNotTyped.send as CryptoId,
            receive: quoteNotTyped.receive as CryptoId,
            receiveAddress: 'receiveAddress',
            orderId: 'orderId',
        };
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({
                wallet: combineReducers({
                    tradingNew: tradingReducer,
                }),
            }),
            preloadedState: {
                wallet: {
                    tradingNew: {
                        ...initialState,
                        exchange: {
                            ...initialState.exchange,
                            ...(initialExchangeState ?? {}),
                            selectedQuote: {
                                ...quote,
                                ...(initialExchangeState?.selectedQuote ?? {}),
                            },
                        },
                    },
                },
            },
        });

        const mockProcessResponseData = jest.fn();
        const mockTriggerAnalyticsTradeConfirmation = jest.fn();
        const mockNextStep = jest.fn();

        const account = accountEth as Account;
        const device = {} as TrezorDevice;

        return {
            store,
            returnUrl: 'returnUrl',
            account,
            device,
            mockProcessResponseData,
            mockTriggerAnalyticsTradeConfirmation,
            mockNextStep,
        };
    };

    it('should return error notification when signData in selectedQuote is not filled', async () => {
        const {
            store,
            returnUrl,
            device,
            account,
            mockProcessResponseData,
            mockNextStep,
            mockTriggerAnalyticsTradeConfirmation,
        } = getMocks();

        await store.dispatch(
            exchangeThunks.signDataAndConfirmThunk({
                account,
                returnUrl,
                device,
                nextStep: mockNextStep,
                triggerAnalyticsTradeConfirmation: mockTriggerAnalyticsTradeConfirmation,
                processResponseData: mockProcessResponseData,
            }),
        );

        const actionToast = store
            .getActions()
            .find(action => action.type === '@common/in-app-notifications/addToast');

        expect(store.getActions().length).toEqual(3);
        expect(actionToast?.payload?.type).toEqual('error');
        expect(actionToast?.payload?.error).toEqual('Cannot sign, missing data');
    });

    it('should return error notification when signData type is not eip712-typed-data', async () => {
        const {
            store,
            returnUrl,
            device,
            account,
            mockProcessResponseData,
            mockNextStep,
            mockTriggerAnalyticsTradeConfirmation,
        } = getMocks({
            selectedQuote: {
                signData: {
                    type: 'eip2014',
                    data: {},
                } as any,
            },
        });

        await store.dispatch(
            exchangeThunks.signDataAndConfirmThunk({
                account,
                returnUrl,
                device,
                nextStep: mockNextStep,
                triggerAnalyticsTradeConfirmation: mockTriggerAnalyticsTradeConfirmation,
                processResponseData: mockProcessResponseData,
            }),
        );

        const actionToast = store
            .getActions()
            .find(action => action.type === '@common/in-app-notifications/addToast');

        expect(store.getActions().length).toEqual(3);
        expect(actionToast?.payload?.type).toEqual('error');
        expect(actionToast?.payload?.error).toEqual('Cannot sign data, unsupported network');
    });

    it('should return error notification when account networkType is not ethereum', async () => {
        const {
            store,
            returnUrl,
            device,
            account,
            mockProcessResponseData,
            mockNextStep,
            mockTriggerAnalyticsTradeConfirmation,
        } = getMocks({
            selectedQuote: {
                signData: {
                    type: 'eip712-typed-data',
                    data: {},
                },
            },
        });

        await store.dispatch(
            exchangeThunks.signDataAndConfirmThunk({
                account: {
                    ...account,
                    networkType: 'bitcoin',
                } as Account,
                returnUrl,
                device,
                nextStep: mockNextStep,
                triggerAnalyticsTradeConfirmation: mockTriggerAnalyticsTradeConfirmation,
                processResponseData: mockProcessResponseData,
            }),
        );

        const actionToast = store
            .getActions()
            .find(action => action.type === '@common/in-app-notifications/addToast');

        expect(store.getActions().length).toEqual(3);
        expect(actionToast?.payload?.type).toEqual('error');
        expect(actionToast?.payload?.error).toEqual('Cannot sign data, unsupported network');
    });

    it('should return error notification when ethereum signing is not successful', async () => {
        const {
            store,
            returnUrl,
            device,
            account,
            mockProcessResponseData,
            mockNextStep,
            mockTriggerAnalyticsTradeConfirmation,
        } = getMocks({
            selectedQuote: {
                signData: {
                    type: 'eip712-typed-data',
                    data: {},
                },
            },
        });

        TrezorConnect.ethereumSignTypedData = jest.fn().mockResolvedValue({
            success: false,
            payload: {
                error: 'Data is not correct',
            },
        });

        await store.dispatch(
            exchangeThunks.signDataAndConfirmThunk({
                account,
                returnUrl,
                device,
                nextStep: mockNextStep,
                triggerAnalyticsTradeConfirmation: mockTriggerAnalyticsTradeConfirmation,
                processResponseData: mockProcessResponseData,
            }),
        );

        const { tradingNew } = store.getState().wallet;
        const actionToast = store
            .getActions()
            .find(action => action.type === '@common/in-app-notifications/addToast');

        expect(store.getActions().length).toEqual(4);
        expect(tradingNew.modalAccountKey).toEqual(account.key);
        expect(actionToast?.payload?.type).toEqual('sign-message-error');
        expect(actionToast?.payload?.error).toEqual('Data is not correct');
    });

    it('should not continue to confirmation and saving trade when there is not receive address in selected quote', async () => {
        const {
            store,
            returnUrl,
            device,
            account,
            mockProcessResponseData,
            mockNextStep,
            mockTriggerAnalyticsTradeConfirmation,
        } = getMocks({
            selectedQuote: {
                signData: {
                    type: 'eip712-typed-data',
                    data: {},
                },
                receiveAddress: undefined,
            },
        });

        TrezorConnect.ethereumSignTypedData = jest.fn().mockResolvedValue({
            success: true,
            payload: {
                signature: 'signature',
            },
        });

        (exchangeThunks.confirmTradeThunk as unknown as jest.Mock) = jest
            .fn()
            .mockImplementation(createThunk('@trading-exchange/thunk/confirmTrade', () => false));

        await store.dispatch(
            exchangeThunks.signDataAndConfirmThunk({
                account,
                returnUrl,
                device,
                nextStep: mockNextStep,
                triggerAnalyticsTradeConfirmation: mockTriggerAnalyticsTradeConfirmation,
                processResponseData: mockProcessResponseData,
            }),
        );

        const { tradingNew } = store.getState().wallet;

        expect(store.getActions().length).toEqual(3);
        expect(tradingNew.modalAccountKey).toEqual(account.key);
        expect(tradingNew.trades).toEqual([]);
        expect(exchangeThunks.confirmTradeThunk).not.toHaveBeenCalled();
    });

    it('should successfully go to the confirmation', async () => {
        const {
            store,
            returnUrl,
            device,
            account,
            mockProcessResponseData,
            mockNextStep,
            mockTriggerAnalyticsTradeConfirmation,
        } = getMocks({
            selectedQuote: {
                signData: {
                    type: 'eip712-typed-data',
                    data: {},
                },
            },
        });

        TrezorConnect.ethereumSignTypedData = jest.fn().mockResolvedValue({
            success: true,
            payload: {
                signature: 'signature',
            },
        });

        const dateString = new Date().toISOString();
        jest.spyOn(Date.prototype, 'toISOString').mockImplementation(() => dateString);

        await store.dispatch(
            exchangeThunks.signDataAndConfirmThunk({
                account,
                returnUrl,
                device,
                nextStep: mockNextStep,
                triggerAnalyticsTradeConfirmation: mockTriggerAnalyticsTradeConfirmation,
                processResponseData: mockProcessResponseData,
            }),
        );

        const { tradingNew } = store.getState().wallet;
        const { selectedQuote } = tradingNew.exchange;
        const trade = {
            ...selectedQuote,
            signature: 'signature',
            status: 'SIGN_DATA' as const,
        };

        (exchangeThunks.confirmTradeThunk as unknown as jest.Mock) = jest
            .fn()
            .mockImplementation(createThunk('@trading-exchange/thunk/confirmTrade', () => true));

        expect(store.getActions().length).toEqual(6);
        expect(tradingNew.modalAccountKey).toEqual(account.key);
        expect(tradingNew.trades[0]).toEqual({
            tradeType: 'exchange',
            date: dateString,
            data: trade,
            key: trade.orderId,
        });
    });
});
