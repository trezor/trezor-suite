import { act } from '@testing-library/react';
import { type ExchangeTrade } from 'invity-api';

import { configureMockStore, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { tradingExchangeActions } from '@suite-common/trading';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { useExchangeApproval } from './useExchangeApproval';

const RESULT_TRADE: ExchangeTrade = { exchange: 'provider-1', status: 'CONFIRM' };

const mockGetTradeRequestParams = jest.fn(() =>
    Promise.resolve({ processResponseData: jest.fn() }),
);
const mockConfirmApproval = jest.fn((_payload: unknown) => () => ({
    unwrap: () => Promise.resolve(RESULT_TRADE),
}));

jest.mock('src/hooks/wallet/trading/form/common/useTradingExchangeTradeRequest', () => ({
    useTradingExchangeTradeRequest: () => ({ getTradeRequestParams: mockGetTradeRequestParams }),
}));

jest.mock('@suite-common/trading', () => {
    const actual = jest.requireActual('@suite-common/trading');

    return {
        ...actual,
        exchangeThunks: {
            ...actual.exchangeThunks,
            confirmApprovalThunk: (payload: unknown) => mockConfirmApproval(payload),
        },
    };
});

const ACCOUNT = mockWalletAccount({ symbol: 'eth', formattedBalance: '2' });

const TRADE: ExchangeTrade = { exchange: 'provider-1', status: 'CONFIRM' };

const renderExchangeApproval = (receiveAddress?: string) => {
    const store = configureMockStore();

    const utils = renderHookWithStoreProvider(
        () => useExchangeApproval({ account: ACCOUNT, receiveAddress, extraField: undefined }),
        { store },
    );

    return { ...utils, store };
};

describe('useExchangeApproval', () => {
    beforeEach(() => {
        mockGetTradeRequestParams.mockClear();
        mockConfirmApproval.mockClear();
    });

    it('approveTransaction confirms the trade with a CONFIRM status', async () => {
        const { result } = renderExchangeApproval('0xreceive');

        let outcome: boolean | undefined;
        await act(async () => {
            outcome = await result.current.approveTransaction(TRADE);
        });

        expect(outcome).toBe(true);
        expect(mockConfirmApproval).toHaveBeenCalledWith(
            expect.objectContaining({
                receiveAddress: '0xreceive',
                trade: expect.objectContaining({ status: 'CONFIRM' }),
            }),
        );
    });

    it('approveTransaction is a no-op without a receive address', async () => {
        const { result } = renderExchangeApproval(undefined);

        let outcome: boolean | undefined;
        await act(async () => {
            outcome = await result.current.approveTransaction(TRADE);
        });

        expect(outcome).toBe(false);
        expect(mockConfirmApproval).not.toHaveBeenCalled();
    });

    it('revokeApproval saves a ZERO-approval quote before confirming', async () => {
        const { result, store } = renderExchangeApproval('0xreceive');

        let outcome: boolean | undefined;
        await act(async () => {
            outcome = await result.current.revokeApproval(TRADE);
        });

        expect(outcome).toBe(true);
        expect(store.getActions().map(action => action.type)).toContain(
            tradingExchangeActions.saveSelectedQuote.type,
        );
        expect(mockConfirmApproval).toHaveBeenCalledWith(
            expect.objectContaining({
                trade: expect.objectContaining({ approvalType: 'ZERO' }),
            }),
        );
    });

    it('confirmApproval early-returns when the trade request params are unavailable', async () => {
        mockGetTradeRequestParams.mockResolvedValueOnce(
            undefined as unknown as { processResponseData: jest.Mock },
        );
        const { result } = renderExchangeApproval('0xreceive');

        let outcome: ExchangeTrade | undefined;
        await act(async () => {
            outcome = await result.current.confirmApproval({ trade: TRADE, receiveAddress: '0xr' });
        });

        expect(outcome).toBeUndefined();
        expect(mockConfirmApproval).not.toHaveBeenCalled();
    });
});
