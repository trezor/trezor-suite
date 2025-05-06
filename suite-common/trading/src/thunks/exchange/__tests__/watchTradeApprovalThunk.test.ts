import { combineReducers } from '@reduxjs/toolkit';
import { CryptoId, ExchangeTrade } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { configureMockStore, extraDependenciesMock } from '@suite-common/test-utils';
import { Account } from '@suite-common/wallet-types';

import { exchangeThunks } from '../../';
import { MIN_MAX_QUOTES_OK } from '../../../__fixtures__/exchangeUtils';
import { accountBtc } from '../../../__fixtures__/utils';
import { invityAPI } from '../../../invityAPI';
import { TradingExchangeState } from '../../../reducers/exchangeReducer';
import { initialState, prepareTradingReducer } from '../../../reducers/tradingReducer';

describe('watchTradeApprovalThunk', () => {
    jest.mock('../../../invityAPI');

    const date = new Date('2025-04-09');

    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(date);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const tradingReducer = prepareTradingReducer(extraDependenciesMock);

    const quoteNotTyped = MIN_MAX_QUOTES_OK[0];
    const exchangeQuote: ExchangeTrade = {
        ...quoteNotTyped,
        send: quoteNotTyped.send as CryptoId,
        receive: quoteNotTyped.receive as CryptoId,
        status: 'LOADING',
    };

    const getMocks = (initialExchangeState?: Partial<TradingExchangeState>) => {
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
                            selectedQuote: exchangeQuote,
                            ...(initialExchangeState ?? {}),
                        },
                    },
                },
            },
        });

        const mockProcessResponseData = jest.fn();
        const mockTriggerAnalyticsTradeConfirmation = jest.fn();
        const mockNextStep = jest.fn();

        const account = accountBtc as Account;

        const dateISO = date.toISOString();

        return {
            store,
            returnUrl: 'returnUrl',
            receiveAddress: 'receiveAddress',
            account,
            dateISO,
            mockProcessResponseData,
            mockTriggerAnalyticsTradeConfirmation,
            mockNextStep,
        };
    };

    it('should do nothing when there is not selectedQuotes', async () => {
        const {
            store,
            account,
            returnUrl,
            mockProcessResponseData,
            mockTriggerAnalyticsTradeConfirmation,
            mockNextStep,
        } = getMocks({
            selectedQuote: undefined,
        });

        jest.spyOn(invityAPI, 'watchTrade');
        jest.spyOn(exchangeThunks, 'confirmTradeThunk').mockImplementation(
            createThunk('@trading/thunk/confirmTradeThunk', () => true),
        );

        await store.dispatch(
            exchangeThunks.watchTradeApprovalThunk({
                account,
                returnUrl,
                refreshCount: 0,
                triggerAnalyticsTradeConfirmation: mockTriggerAnalyticsTradeConfirmation,
                processResponseData: mockProcessResponseData,
                nextStep: mockNextStep,
            }),
        );

        const exchangeState = store.getState().wallet.tradingNew.exchange;

        expect(exchangeState.selectedQuote).toEqual(undefined);
        expect(invityAPI.watchTrade).not.toHaveBeenCalled();
        expect(exchangeThunks.confirmTradeThunk).not.toHaveBeenCalled();
    });

    it.each([
        ['should do nothing when response status is undefined', { status: undefined }],
        [
            'should do nothing when response status is the same as selectedQuote status',
            { status: 'LOADING' },
        ],
    ])('%s', async (_, response) => {
        const {
            store,
            account,
            returnUrl,
            mockProcessResponseData,
            mockTriggerAnalyticsTradeConfirmation,
            mockNextStep,
        } = getMocks();

        invityAPI.watchTrade = jest.fn().mockImplementation(() => Promise.resolve(response));
        jest.spyOn(exchangeThunks, 'confirmTradeThunk').mockImplementation(
            createThunk('@trading/thunk/confirmTradeThunk', () => true),
        );

        await store.dispatch(
            exchangeThunks.watchTradeApprovalThunk({
                account,
                returnUrl,
                refreshCount: 0,
                triggerAnalyticsTradeConfirmation: mockTriggerAnalyticsTradeConfirmation,
                processResponseData: mockProcessResponseData,
                nextStep: mockNextStep,
            }),
        );

        const exchangeState = store.getState().wallet.tradingNew.exchange;

        expect(exchangeState.selectedQuote).toEqual(exchangeState.selectedQuote);
        expect(invityAPI.watchTrade).toHaveBeenCalled();
        expect(exchangeThunks.confirmTradeThunk).not.toHaveBeenCalled();
    });

    it.each([
        [
            'should not call confirm trade when dexTx is not defined',
            { receiveAddress: 'receiveAddress' },
        ],
        [
            'should not call confirm trade when receiveAddress is not defined',
            { dexTx: { from: 'form', to: 'to', data: 'data', value: 'value' } },
        ],
    ])('$%s', async (_, updatedQuote) => {
        const {
            store,
            account,
            returnUrl,
            mockProcessResponseData,
            mockTriggerAnalyticsTradeConfirmation,
            mockNextStep,
        } = getMocks({
            selectedQuote: {
                ...exchangeQuote,
                ...updatedQuote,
            },
        });

        invityAPI.watchTrade = jest
            .fn()
            .mockImplementation(() => Promise.resolve({ status: 'SUCCESS' }));
        jest.spyOn(exchangeThunks, 'confirmTradeThunk').mockImplementation(
            createThunk('@trading/thunk/confirmTradeThunk', () => true),
        );

        await store.dispatch(
            exchangeThunks.watchTradeApprovalThunk({
                account,
                returnUrl,
                refreshCount: 0,
                triggerAnalyticsTradeConfirmation: mockTriggerAnalyticsTradeConfirmation,
                processResponseData: mockProcessResponseData,
                nextStep: mockNextStep,
            }),
        );

        const exchangeState = store.getState().wallet.tradingNew.exchange;
        const quote = {
            ...exchangeState.selectedQuote,
            status: 'SUCCESS',
            error: undefined,
            approvalType: undefined,
        };

        expect(quote).toEqual(quote);
        expect(invityAPI.watchTrade).toHaveBeenCalled();
        expect(exchangeThunks.confirmTradeThunk).not.toHaveBeenCalled();
    });

    it('should update quote and also call confirmTradeThunk', async () => {
        const {
            store,
            account,
            returnUrl,
            mockProcessResponseData,
            mockTriggerAnalyticsTradeConfirmation,
            mockNextStep,
        } = getMocks({
            selectedQuote: {
                ...exchangeQuote,
                dexTx: { from: 'form', to: 'to', data: 'data', value: 'value' },
                receiveAddress: 'receiveAddress',
            },
        });

        invityAPI.watchTrade = jest
            .fn()
            .mockImplementation(() => Promise.resolve({ status: 'SUCCESS' }));

        jest.spyOn(exchangeThunks, 'confirmTradeThunk').mockImplementation(
            createThunk('@trading/thunk/confirmTradeThunk', () => true),
        );

        await store.dispatch(
            exchangeThunks.watchTradeApprovalThunk({
                account,
                returnUrl,
                refreshCount: 0,
                triggerAnalyticsTradeConfirmation: mockTriggerAnalyticsTradeConfirmation,
                processResponseData: mockProcessResponseData,
                nextStep: mockNextStep,
            }),
        );

        const exchangeState = store.getState().wallet.tradingNew.exchange;

        const quote = {
            ...exchangeState.selectedQuote,
            status: 'SUCCESS',
            error: undefined,
            approvalType: undefined,
        };

        expect(quote).toEqual(quote);
        expect(invityAPI.watchTrade).toHaveBeenCalled();
        expect(exchangeThunks.confirmTradeThunk).toHaveBeenCalled();
    });
});
