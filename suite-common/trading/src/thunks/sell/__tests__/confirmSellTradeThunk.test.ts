import { combineReducers } from '@reduxjs/toolkit';
import { type BankAccount, type SellFiatTrade } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';
import { type Account } from '@suite-common/wallet-types';

import { sellThunks } from '../';
import { accountBtc } from '../../../__fixtures__/utils';
import { invityAPI } from '../../../invityAPI';
import { type TradingSellState } from '../../../reducers/sellReducer';
import { initialState } from '../../../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../../../reducers/tradingReducer';
import { sellUtilsFixtures } from '../../../utils/sell/__fixtures__/sellUtils';
import { handleSellTradeThunk } from '../handleSellTradeThunk';

jest.mock('../handleSellTradeThunk', () => {
    const actual = jest.requireActual('../handleSellTradeThunk');

    return {
        ...actual,
        handleSellTradeThunk: Object.assign(
            jest.fn(actual.handleSellTradeThunk),
            actual.handleSellTradeThunk,
        ),
    };
});

const tradingReducer = prepareTradingReducer(extraDependenciesCommonMock);

describe('confirmSellTradeThunk', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    jest.mock('../../../invityAPI');

    invityAPI.setInvityServersEnvironment = () => {};
    invityAPI.createInvityAPIKey = () => {};

    const getMocks = (initialSellState?: Partial<TradingSellState>) => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({
                wallet: combineReducers({
                    trading: tradingReducer,
                }),
            }),
            preloadedState: {
                wallet: {
                    trading: {
                        ...initialState,
                        sell: {
                            ...initialState.sell,
                            selectedQuote: sellUtilsFixtures.MIN_MAX_QUOTES_LOW[0],
                            ...(initialSellState ?? {}),
                        },
                    },
                },
            },
        });

        const account = accountBtc as Account;
        const bankAccount: BankAccount = {
            bankAccount: 'bankAccount',
            holder: 'holder',
            verified: true,
        };

        const mockTriggerAnalyticsTradeConfirmation = jest.fn();
        const mockProcessResponseData = jest.fn();

        return {
            store,
            returnUrl: 'returnUrl',
            account,
            bankAccount,
            mockTriggerAnalyticsTradeConfirmation,
            mockProcessResponseData,
        };
    };

    it('should successfully confirmed trade', async () => {
        const {
            store,
            bankAccount,
            account,
            returnUrl,
            mockTriggerAnalyticsTradeConfirmation,
            mockProcessResponseData,
        } = getMocks();

        const trade: SellFiatTrade = {
            ...sellUtilsFixtures.MIN_MAX_QUOTES_LOW[0],
            status: 'CANCELLED',
        };

        (handleSellTradeThunk as jest.Mock).mockImplementation(
            createThunk('@trading-sell/thunk/handleTrade', (_, { fulfillWithValue }) =>
                fulfillWithValue(trade),
            ),
        );

        await store
            .dispatch(
                sellThunks.confirmTradeThunk({
                    account,
                    bankAccount,
                    returnUrl,
                    triggerAnalyticsTradeConfirmation: mockTriggerAnalyticsTradeConfirmation,
                    processResponseData: mockProcessResponseData,
                }),
            )
            .unwrap();

        const sellState = store.getState().wallet.trading.sell;

        expect(mockTriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
        expect(handleSellTradeThunk).toHaveBeenCalledTimes(1);
        expect(sellState.selectedQuote).toEqual(trade);
        expect(sellState.formStep).toEqual('SEND_TRANSACTION');
    });

    it('should not set state when selectedQuote is undefined', async () => {
        const {
            store,
            bankAccount,
            account,
            returnUrl,
            mockTriggerAnalyticsTradeConfirmation,
            mockProcessResponseData,
        } = getMocks({
            selectedQuote: undefined,
        });

        const trade: SellFiatTrade = {
            ...sellUtilsFixtures.MIN_MAX_QUOTES_LOW[0],
            status: 'CANCELLED',
        };

        jest.spyOn(sellThunks, 'handleTradeThunk').mockImplementation(
            createThunk('@trading-sell/thunk/handleTrade', (_, { fulfillWithValue }) =>
                fulfillWithValue(trade),
            ),
        );

        await store
            .dispatch(
                sellThunks.confirmTradeThunk({
                    account,
                    bankAccount,
                    returnUrl,
                    triggerAnalyticsTradeConfirmation: mockTriggerAnalyticsTradeConfirmation,
                    processResponseData: mockProcessResponseData,
                }),
            )
            .unwrap();

        const sellState = store.getState().wallet.trading.sell;

        expect(mockTriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(0);
        expect(handleSellTradeThunk).toHaveBeenCalledTimes(0);
        expect(sellState.selectedQuote).toEqual(undefined);
        expect(sellState.formStep).toEqual('BANK_ACCOUNT');
    });

    it('should not set state, but trigger analytics when handleTradeThunk will not return response', async () => {
        const {
            store,
            bankAccount,
            account,
            returnUrl,
            mockTriggerAnalyticsTradeConfirmation,
            mockProcessResponseData,
        } = getMocks();

        (handleSellTradeThunk as jest.Mock).mockImplementation(
            createThunk('@trading-sell/thunk/handleTrade', (_, { fulfillWithValue }) =>
                fulfillWithValue(undefined),
            ),
        );

        await store
            .dispatch(
                sellThunks.confirmTradeThunk({
                    account,
                    bankAccount,
                    returnUrl,
                    triggerAnalyticsTradeConfirmation: mockTriggerAnalyticsTradeConfirmation,
                    processResponseData: mockProcessResponseData,
                }),
            )
            .unwrap();

        const sellState = store.getState().wallet.trading.sell;

        expect(mockTriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
        expect(handleSellTradeThunk).toHaveBeenCalledTimes(1);
        expect(sellState.selectedQuote).toBeDefined();
        expect(sellState.formStep).toEqual('BANK_ACCOUNT');
    });
});
