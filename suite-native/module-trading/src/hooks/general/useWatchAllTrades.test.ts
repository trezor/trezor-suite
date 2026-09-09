import { type Store } from '@reduxjs/toolkit';

import { type TradingRootStateWithDeviceAndAccounts } from '@suite-common/trading';
import { type AccountsRootState } from '@suite-common/wallet-core';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import {
    MOCK_ACCOUNT_DEVICE_SESSION_ID,
    btc1NormalAccount,
    eth1NormalAccount,
    getBuyTrade,
    getExchangeTrade,
    getSellTrade,
    sol1normalAccount,
} from '@suite-native/trading-fixtures';
import { type TradingRootState } from '@suite-native/trading-state';

import { useWatchAllTrades } from './useWatchAllTrades';
import {
    createTradingTestStore,
    renderHookWithTradingProvider,
} from '../../test-utils/tradingTestUtils';

type State = TradingRootState & AccountsRootState & TradingRootStateWithDeviceAndAccounts;

// Mock the useAllTradesReloadTimer hook
jest.mock('./useAllTradesReloadTimer', () => ({
    useAllTradesReloadTimer: jest.fn(),
}));

const mockUseAllTradesReloadTimer = require('./useAllTradesReloadTimer').useAllTradesReloadTimer;

describe('useWatchAllTrades', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        global.fetch = jest.fn().mockImplementation(() =>
            Promise.resolve({
                json: () => Promise.resolve({}),
                ok: true,
            }),
        );

        // Default mock implementation
        mockUseAllTradesReloadTimer.mockReturnValue({
            refreshAllTrades: jest.fn(),
            shouldReload: false,
            hasFetchedInitialTrades: false,
            isFetching: false,
            setIsFetching: jest.fn(),
            tradesToWatch: [],
        });
    });

    const getInitializedStore = ({ trades = [] }: { trades?: any[] } = {}) =>
        createTradingTestStore({
            overrides: {
                wallet: {
                    trading: { trades },
                    accounts: [btc1NormalAccount, eth1NormalAccount, sol1normalAccount],
                },
                device: {
                    selectedDevice: {
                        state: { staticSessionId: MOCK_ACCOUNT_DEVICE_SESSION_ID },
                    },
                },
            },
        });

    const renderUseWatchAllTrades = async (store: Store<State>) =>
        await renderHookWithTradingProvider(() => useWatchAllTrades(), {
            services: { analytics: mockNativeAnalytics(), store },
        });

    it('should return empty arrays when no trades', async () => {
        const store = getInitializedStore();
        const { result } = await renderUseWatchAllTrades(store);

        expect(result.current.allTrades).toEqual([]);
        expect(result.current.tradesToWatch).toEqual([]);
        expect(result.current.totalTrades).toBe(0);
        expect(result.current.tradesWatching).toBe(0);
    });

    it('should return trades for the current device', async () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
        const exchangeTrade = getExchangeTrade({ status: 'CONVERTING' });
        const sellTrade = getSellTrade({ status: 'SEND_CRYPTO' });

        const store = getInitializedStore({
            trades: [buyTrade, exchangeTrade, sellTrade],
        });
        const { result } = await renderUseWatchAllTrades(store);

        expect(result.current.allTrades).toHaveLength(3);
        expect(result.current.totalTrades).toBe(3);
    });

    it('should return trades to watch from useAllTradesReloadTimer', async () => {
        const mockTradesToWatch = [
            getBuyTrade({ status: 'SUBMITTED' }),
            getExchangeTrade({ status: 'CONVERTING' }),
        ];

        mockUseAllTradesReloadTimer.mockReturnValue({
            refreshAllTrades: jest.fn(),
            shouldReload: false,
            hasFetchedInitialTrades: false,
            isFetching: false,
            setIsFetching: jest.fn(),
            tradesToWatch: mockTradesToWatch,
        });

        const store = getInitializedStore();
        const { result } = await renderUseWatchAllTrades(store);

        expect(result.current.tradesToWatch).toEqual(mockTradesToWatch);
        expect(result.current.tradesWatching).toBe(2);
    });

    it('should call refreshAllTrades when shouldReload is true and not fetching', async () => {
        const mockRefreshAllTrades = jest.fn();
        const mockSetIsFetching = jest.fn();

        mockUseAllTradesReloadTimer.mockReturnValue({
            refreshAllTrades: mockRefreshAllTrades,
            shouldReload: true,
            hasFetchedInitialTrades: false,
            isFetching: false,
            setIsFetching: mockSetIsFetching,
            tradesToWatch: [],
        });

        const store = getInitializedStore();
        await renderUseWatchAllTrades(store);

        // Wait for the effect to run
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockSetIsFetching).toHaveBeenCalledWith(true);
        expect(mockRefreshAllTrades).toHaveBeenCalled();
    });

    it('should not call refreshAllTrades when already fetching', async () => {
        const mockRefreshAllTrades = jest.fn();
        const mockSetIsFetching = jest.fn();

        mockUseAllTradesReloadTimer.mockReturnValue({
            refreshAllTrades: mockRefreshAllTrades,
            shouldReload: true,
            hasFetchedInitialTrades: false,
            isFetching: true,
            setIsFetching: mockSetIsFetching,
            tradesToWatch: [],
        });

        const store = getInitializedStore();
        await renderUseWatchAllTrades(store);

        // Wait for the effect to run
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockRefreshAllTrades).not.toHaveBeenCalled();
    });

    it('should not call refreshAllTrades when hasFetchedInitialTrades is true and shouldReload is false', async () => {
        const mockRefreshAllTrades = jest.fn();
        const mockSetIsFetching = jest.fn();

        mockUseAllTradesReloadTimer.mockReturnValue({
            refreshAllTrades: mockRefreshAllTrades,
            shouldReload: false,
            hasFetchedInitialTrades: true,
            isFetching: false,
            setIsFetching: mockSetIsFetching,
            tradesToWatch: [],
        });

        const store = getInitializedStore();
        await renderUseWatchAllTrades(store);

        // Wait for the effect to run
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockRefreshAllTrades).not.toHaveBeenCalled();
    });
});
