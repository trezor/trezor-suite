import { combineReducers } from '@reduxjs/toolkit';
import { type SellFiatTrade } from 'invity-api';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mock } from '@trezor/dependency-injection';
import { createThunk } from '@trezor/redux-utils';
import { mockActionType } from '@trezor/redux-utils/mocks';

import {
    type ConfirmSellTradeThunkProps,
    type ConfirmSellTradeThunkState,
} from './confirmSellTradeThunk';
import { handleSellTradeThunk } from './handleSellTradeThunk';
import { mockBankAccount } from '../../../mocks/mockBankAccount';
import { mockSellFiatTrade } from '../../../mocks/mockSellFiatTrade';
import { type TradingSellState } from '../../reducers/sellReducer';
import { initialState } from '../../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../../reducers/tradingReducer';

import { sellThunks } from './index';

jest.mock('./handleSellTradeThunk', () => {
    const actual = jest.requireActual('./handleSellTradeThunk');

    return {
        ...actual,
        handleSellTradeThunk: Object.assign(
            jest.fn(actual.handleSellTradeThunk),
            actual.handleSellTradeThunk,
        ),
    };
});

const tradingReducer = prepareTradingReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});

const account = mockWalletAccount({ symbol: asNetworkSymbol('btc') });
const bankAccount = mockBankAccount();
const returnUrl = 'returnUrl';

const QUOTE = mockSellFiatTrade();

const mockHandleTradeResponse = (response: SellFiatTrade | undefined) => {
    (handleSellTradeThunk as unknown as jest.Mock).mockImplementation(
        createThunk('@trading-sell/thunk/handleTrade', (_, { fulfillWithValue }) =>
            fulfillWithValue(response),
        ),
    );
};

const getStore = (sellState?: Partial<TradingSellState>) =>
    createTestCompositionRoot<void, ConfirmSellTradeThunkState>({
        reducer: combineReducers({
            wallet: combineReducers({
                trading: tradingReducer,
            }),
        }),
        preloadedState: {
            wallet: {
                trading: {
                    ...initialState,
                    sell: { ...initialState.sell, selectedQuote: QUOTE, ...sellState },
                },
            },
        },
    }).services.store;

const confirmTrade = (
    store: ReturnType<typeof getStore>,
    props: Partial<ConfirmSellTradeThunkProps> = {},
) =>
    store
        .dispatch(
            sellThunks.confirmTradeThunk({
                account,
                bankAccount,
                returnUrl,
                triggerAnalyticsTradeConfirmation:
                    mock<ConfirmSellTradeThunkProps['triggerAnalyticsTradeConfirmation']>(),
                processResponseData: mock<ConfirmSellTradeThunkProps['processResponseData']>(),
                ...props,
            }),
        )
        .unwrap();

describe('confirmSellTradeThunk', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('confirms the trade with the bank account, stores it for watching and moves to the send step', async () => {
        const store = getStore();
        const response = mockSellFiatTrade({ orderId: 'orderId', status: 'SUBMITTED' });
        const triggerAnalyticsTradeConfirmation =
            mock<ConfirmSellTradeThunkProps['triggerAnalyticsTradeConfirmation']>();
        mockHandleTradeResponse(response);

        const confirmedTrade = await confirmTrade(store, { triggerAnalyticsTradeConfirmation });

        const { sell, trades } = store.getState().wallet.trading;

        expect(triggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
        expect(handleSellTradeThunk).toHaveBeenCalledWith(
            expect.objectContaining({ account, returnUrl, trade: { ...QUOTE, bankAccount } }),
        );
        expect(confirmedTrade).toEqual({ ...response, bankAccount });
        expect(sell.selectedQuote).toEqual({ ...response, bankAccount });
        expect(sell.transactionId).toBe('orderId');
        expect(sell.formStep).toBe('SEND_TRANSACTION');
        expect(trades).toEqual([
            expect.objectContaining({
                tradeType: 'sell',
                key: 'orderId',
                sendAccountKey: account.key,
                data: { ...response, bankAccount },
            }),
        ]);
    });

    it('keeps the bank accounts of the quote when the provider omits them', async () => {
        const bankAccounts = [
            bankAccount,
            mockBankAccount({ bankAccount: 'otherBankAccount', verified: false }),
        ];
        const store = getStore({ selectedQuote: { ...QUOTE, bankAccounts } });
        mockHandleTradeResponse(
            mockSellFiatTrade({
                orderId: 'orderId',
                status: 'SEND_CRYPTO',
                destinationAddress: 'destinationAddress',
            }),
        );

        await confirmTrade(store);

        expect(store.getState().wallet.trading.sell.selectedQuote).toEqual(
            expect.objectContaining({
                bankAccount,
                bankAccounts,
                destinationAddress: 'destinationAddress',
            }),
        );
    });

    it('does not save a trade to watch without an order id', async () => {
        const store = getStore();
        mockHandleTradeResponse(mockSellFiatTrade({ status: 'SUBMITTED' }));

        await confirmTrade(store);

        const { sell, trades } = store.getState().wallet.trading;

        expect(trades).toEqual([]);
        expect(sell.transactionId).toBeUndefined();
        expect(sell.formStep).toBe('SEND_TRANSACTION');
    });

    it('does nothing without a selected quote', async () => {
        const store = getStore({ selectedQuote: undefined });
        const triggerAnalyticsTradeConfirmation =
            mock<ConfirmSellTradeThunkProps['triggerAnalyticsTradeConfirmation']>();

        const confirmedTrade = await confirmTrade(store, { triggerAnalyticsTradeConfirmation });

        const { sell } = store.getState().wallet.trading;

        expect(confirmedTrade).toBeUndefined();
        expect(triggerAnalyticsTradeConfirmation).not.toHaveBeenCalled();
        expect(handleSellTradeThunk).not.toHaveBeenCalled();
        expect(sell.selectedQuote).toBeUndefined();
        expect(sell.formStep).toBe('BANK_ACCOUNT');
    });

    it('stays on the bank account step when the provider asks for another site action', async () => {
        const store = getStore();
        const triggerAnalyticsTradeConfirmation =
            mock<ConfirmSellTradeThunkProps['triggerAnalyticsTradeConfirmation']>();
        mockHandleTradeResponse(undefined);

        const confirmedTrade = await confirmTrade(store, { triggerAnalyticsTradeConfirmation });

        const { sell } = store.getState().wallet.trading;

        expect(confirmedTrade).toBeUndefined();
        expect(triggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
        expect(handleSellTradeThunk).toHaveBeenCalledTimes(1);
        expect(sell.selectedQuote).toEqual(QUOTE);
        expect(sell.formStep).toBe('BANK_ACCOUNT');
    });
});
