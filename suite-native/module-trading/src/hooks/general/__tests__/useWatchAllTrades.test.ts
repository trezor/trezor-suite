import { type PreloadedState, type TestStore, initStore, renderHookWithStoreProviderAsync } from '@suite-native/test-utils/store';
import {
    MOCK_ACCOUNT_DEVICE_SESSION_ID,
    btc1NormalAccount,
    eth1NormalAccount,
    getBuyTrade,
    getExchangeTrade,
    getInitializedTradingState,
    getSellTrade,
    sol1normalAccount,
} from '@suite-native/trading-fixtures';

import { useWatchAllTrades } from '../useWatchAllTrades';

// Mock the useAllTradesReloadTimer hook
jest.mock('../useAllTradesReloadTimer', () => ({
    useAllTradesReloadTimer: jest.fn(),
}));

// Mock the useTransactionStateChangeAnalyticsReporting hook
jest.mock('../useTransactionStateChangeAnalyticsReporting', () => ({
    useTransactionStateChangeAnalyticsReporting: jest.fn(),
}));

const mockUseAllTradesReloadTimer = require('../useAllTradesReloadTimer').useAllTradesReloadTimer;

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

    const getInitializedStore = ({ trades = [] }: { trades?: any[] } = {}) => {
        const preloadedState: PreloadedState = {
            wallet: {
                trading: {
                    ...getInitializedTradingState(),
                    trades,
                },
                accounts: [
                    {
                        key: btc1NormalAccount.key,
                        symbol: 'btc',
                        deviceState: MOCK_ACCOUNT_DEVICE_SESSION_ID,
                        descriptor: 'btc-descriptor',
                        addresses: { unused: [{ address: 'btc-address' }] },
                        visible: true,
                    },
                    {
                        key: eth1NormalAccount.key,
                        symbol: 'eth',
                        deviceState: MOCK_ACCOUNT_DEVICE_SESSION_ID,
                        descriptor: 'eth-descriptor',
                        addresses: { unused: [{ address: 'eth-address' }] },
                        visible: true,
                    },
                    {
                        key: sol1normalAccount.key,
                        symbol: 'sol',
                        deviceState: MOCK_ACCOUNT_DEVICE_SESSION_ID,
                        descriptor: 'sol-descriptor',
                        addresses: { unused: [{ address: 'sol-address' }] },
                        visible: true,
                    },
                ],
            },
            device: {
                selectedDevice: {
                    state: { staticSessionId: MOCK_ACCOUNT_DEVICE_SESSION_ID },
                },
            },
        };

        return initStore(preloadedState).store;
    };

    const renderUseWatchAllTrades = (store: TestStore) =>
        renderHookWithStoreProviderAsync(() => useWatchAllTrades(), { store });

    it('should return empty arrays when no trades', async () => {
        const store = await getInitializedStore();
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

        const store = await getInitializedStore({
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

        const store = await getInitializedStore();
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

        const store = await getInitializedStore();
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

        const store = await getInitializedStore();
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

        const store = await getInitializedStore();
        await renderUseWatchAllTrades(store);

        // Wait for the effect to run
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockRefreshAllTrades).not.toHaveBeenCalled();
    });
});
