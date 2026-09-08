import { act } from '@testing-library/react';

import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import {
    type TradingTransaction,
    type TradingTransactionBuy,
    type TradingTransactionExchange,
    initialState as tradingInitialState,
} from '@suite-common/trading';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type StaticSessionId } from '@trezor/device-utils';

import { type AppState } from 'src/reducers/store';

import {
    TRADING_TRANSACTIONS_REFRESH_INTERVAL_MS,
    useTradingTransactionsWatcher,
} from './useTradingTransactionsWatcher';
import { mockInitialAppState } from '../../../../../../mocks/mockInitialAppState';

type WatchTradePayload = {
    account: Account;
    trade: TradingTransaction;
    refreshCount: number;
};

// A refresh of a single trade takes this long; 0 resolves immediately.
let mockRefreshDurationMs = 0;

const mockWatchTradeThunk = jest.fn(
    (_payload: WatchTradePayload) => () =>
        mockRefreshDurationMs === 0
            ? Promise.resolve()
            : new Promise<void>(resolve => setTimeout(resolve, mockRefreshDurationMs)),
);

jest.mock('@suite-common/trading', () => {
    const actual = jest.requireActual('@suite-common/trading');

    return {
        ...actual,
        tradingThunks: {
            ...actual.tradingThunks,
            watchTradeThunk: (payload: WatchTradePayload) => mockWatchTradeThunk(payload),
        },
    };
});

const DEVICE_STATIC_SESSION_ID = 'descriptor@deviceId:0' as StaticSessionId;

const selectedDevice = mockSuiteDevice({
    connected: true,
    available: true,
    state: { staticSessionId: DEVICE_STATIC_SESSION_ID },
});

const btcAccount = mockWalletAccount({
    symbol: 'btc',
    descriptor: asAccountDescriptor('btcDescriptor'),
    deviceState: DEVICE_STATIC_SESSION_ID,
});
const ethAccount = mockWalletAccount({
    symbol: 'eth',
    descriptor: asAccountDescriptor('ethDescriptor'),
    deviceState: DEVICE_STATIC_SESSION_ID,
});

const pendingBuy: TradingTransactionBuy = {
    tradeType: 'buy',
    key: 'pending-buy',
    date: '2026-01-01T00:00:00Z',
    data: { status: 'SUBMITTED', paymentId: 'pending-buy' },
    selectedAccountKey: btcAccount.key,
    receiveAccountKey: btcAccount.key,
};
const finishedBuy: TradingTransactionBuy = {
    tradeType: 'buy',
    key: 'finished-buy',
    date: '2026-01-01T00:00:00Z',
    data: { status: 'SUCCESS', paymentId: 'finished-buy' },
    selectedAccountKey: btcAccount.key,
    receiveAccountKey: btcAccount.key,
};
const pendingExchange: TradingTransactionExchange = {
    tradeType: 'exchange',
    key: 'pending-exchange',
    date: '2026-01-01T00:00:00Z',
    data: { status: 'CONVERTING', orderId: 'pending-exchange' },
    sendAccountKey: ethAccount.key,
    receiveAccountKey: btcAccount.key,
};

const buildState = (trades: TradingTransaction[]): AppState => ({
    ...mockInitialAppState,
    device: { ...mockInitialAppState.device, selectedDevice },
    wallet: {
        ...mockInitialAppState.wallet,
        accounts: [btcAccount, ethAccount],
        trading: { ...tradingInitialState, trades },
    },
});

const renderWatcher = (trades: TradingTransaction[]) => {
    const root = createTestCompositionRoot({
        extra: { services: { analytics: mockDesktopAnalytics() } },
        preloadedState: buildState(trades),
    });

    return renderHookWithStoreProvider(() => useTradingTransactionsWatcher(), { root });
};

const getRefreshedTradeKeys = () =>
    mockWatchTradeThunk.mock.calls.map(([{ trade, refreshCount }]) => ({
        key: trade.key,
        refreshCount,
    }));

describe('useTradingTransactionsWatcher', () => {
    beforeEach(() => {
        jest.useFakeTimers({ legacyFakeTimers: false });
        mockRefreshDurationMs = 0;
        mockWatchTradeThunk.mockClear();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('refreshes every non-final trade with its own account right after mount', async () => {
        renderWatcher([finishedBuy, pendingBuy, pendingExchange]);

        await act(async () => {});

        expect(mockWatchTradeThunk.mock.calls.map(([payload]) => payload)).toEqual([
            { account: btcAccount, trade: pendingBuy, refreshCount: 0 },
            { account: ethAccount, trade: pendingExchange, refreshCount: 0 },
        ]);
    });

    it('refreshes again after the interval with an incremented refresh count', async () => {
        renderWatcher([pendingBuy]);

        await act(async () => {});
        await act(() => jest.advanceTimersByTimeAsync(TRADING_TRANSACTIONS_REFRESH_INTERVAL_MS));

        expect(getRefreshedTradeKeys()).toEqual([
            { key: 'pending-buy', refreshCount: 0 },
            { key: 'pending-buy', refreshCount: 1 },
        ]);
    });

    it('does not start a new cycle while the previous one is still running', async () => {
        mockRefreshDurationMs = TRADING_TRANSACTIONS_REFRESH_INTERVAL_MS * 1.5;

        renderWatcher([pendingBuy]);

        await act(async () => {});
        await act(() => jest.advanceTimersByTimeAsync(TRADING_TRANSACTIONS_REFRESH_INTERVAL_MS));

        expect(getRefreshedTradeKeys()).toEqual([{ key: 'pending-buy', refreshCount: 0 }]);

        await act(() => jest.advanceTimersByTimeAsync(TRADING_TRANSACTIONS_REFRESH_INTERVAL_MS));

        expect(getRefreshedTradeKeys()).toEqual([
            { key: 'pending-buy', refreshCount: 0 },
            { key: 'pending-buy', refreshCount: 1 },
        ]);
    });

    it('does nothing when there is no trade to watch', async () => {
        renderWatcher([finishedBuy]);

        await act(async () => {});
        await act(() => jest.advanceTimersByTimeAsync(TRADING_TRANSACTIONS_REFRESH_INTERVAL_MS));

        expect(mockWatchTradeThunk).not.toHaveBeenCalled();
    });

    it('stops refreshing after unmount', async () => {
        const { unmount } = renderWatcher([pendingBuy]);

        await act(async () => {});
        unmount();
        await act(() => jest.advanceTimersByTimeAsync(TRADING_TRANSACTIONS_REFRESH_INTERVAL_MS));

        expect(mockWatchTradeThunk).toHaveBeenCalledTimes(1);
    });
});
