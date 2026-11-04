import { combineReducers } from '@reduxjs/toolkit';
import { type DexApprovalType, type ExchangeTrade } from 'invity-api';

import { type TestCompositionStore, createTestCompositionRoot } from '@suite-common/test-utils';
import { mockActionType } from '@trezor/redux-utils/mocks';

import { type WatchExchangeApprovalThunkProps } from './watchExchangeApprovalThunk';
import { type TradingRootState, initialState } from '../../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../../reducers/tradingReducer';
import { tradeApi } from '../../tradeApi';

import { exchangeThunks } from './index';

const tradingReducer = prepareTradingReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});

jest.mock('../../tradeApi');

const PENDING_QUOTE: ExchangeTrade = {
    orderId: 'order-1',
    isDex: true,
    status: 'APPROVAL_PENDING',
    approvalSendTxHash: '0xtx',
};

describe('watchExchangeApprovalThunk', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    const getStore = (selectedQuote: ExchangeTrade) =>
        createTestCompositionRoot<void, TradingRootState>({
            reducer: combineReducers({
                wallet: combineReducers({
                    trading: tradingReducer,
                }),
            }),
            preloadedState: {
                wallet: {
                    trading: {
                        ...initialState,
                        exchange: { ...initialState.exchange, selectedQuote },
                    },
                },
            },
        }).services.store;

    const watch = (store: TestCompositionStore<TradingRootState, void>) => {
        const props: WatchExchangeApprovalThunkProps = {
            refreshCount: 1,
        };

        return store.dispatch(exchangeThunks.watchExchangeApprovalThunk(props)).unwrap();
    };

    it.each<[ExchangeTrade['status'], DexApprovalType | undefined, DexApprovalType | undefined]>([
        ['APPROVAL_REQ', 'ZERO', 'ZERO'],
        ['APPROVAL_REQ', 'MINIMAL', undefined],
        ['CONFIRM', 'ZERO', undefined],
        ['CONFIRM', 'MINIMAL', undefined],
    ])(
        'on %s keeps approvalType %s as %s',
        async (responseStatus, approvalType, expectedApprovalType) => {
            jest.mocked(tradeApi.watchTrade).mockResolvedValue({ status: responseStatus });
            const store = getStore({ ...PENDING_QUOTE, approvalType });

            await watch(store);

            expect(store.getState().wallet.trading.exchange.selectedQuote).toEqual({
                ...PENDING_QUOTE,
                status: responseStatus,
                approvalType: expectedApprovalType,
                error: undefined,
            });
        },
    );

    it('does not save the quote when the status did not change', async () => {
        jest.mocked(tradeApi.watchTrade).mockResolvedValue({ status: 'APPROVAL_PENDING' });
        const store = getStore({ ...PENDING_QUOTE, approvalType: 'ZERO' });

        await expect(watch(store)).resolves.toBeUndefined();
        expect(store.getState().wallet.trading.exchange.selectedQuote).toEqual({
            ...PENDING_QUOTE,
            approvalType: 'ZERO',
        });
    });
});
