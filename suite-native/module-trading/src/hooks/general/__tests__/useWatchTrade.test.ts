import React from 'react';

import { type AccountKey } from '@suite-common/wallet-types';
import { useAnalytics } from '@suite-native/services';
import {
    type PreloadedState,
    initStore,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils';
import { getBuyTrade, getInitializedTradingState } from '@suite-native/trading-fixtures';

import { useWatchTrade } from '../useWatchTrade';

jest.mock('../useReloadTimer', () => ({
    useReloadTimer: jest.fn(),
}));

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    tradingThunks: {
        watchTradeThunk: jest.fn(() => ({ type: 'watchTradeThunk' })),
    },
}));

const mockWatchTradeThunk = require('@suite-common/trading').tradingThunks.watchTradeThunk;

const mockUseReloadTimer = require('../useReloadTimer').useReloadTimer;

type ReportSpy = jest.SpyInstance;

const useWatchTradeWithReportSpy = (props: {
    accountKey?: AccountKey;
    orderId?: string;
    isInProgress?: boolean;
}) => {
    const analytics = useAnalytics();
    const spyRef = React.useRef<ReportSpy | null>(null);

    if (!spyRef.current) {
        spyRef.current = jest.spyOn(analytics, 'report');
    }

    useWatchTrade({
        accountKey: props.accountKey,
        orderId: props.orderId,
        isInProgress: props.isInProgress ?? false,
    });

    return spyRef.current!;
};

const btc1AccountKey = 'btc1' as AccountKey; // Todo: create properly via `createAccountKey()`

describe('useWatchTrade', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        mockUseReloadTimer.mockReturnValue({
            timer: {
                reset: jest.fn(),
            },
            shouldReload: false,
            resetCount: 0,
        });
    });

    const getInitializedStore = ({
        trades = [],
        accounts = [],
    }: { trades?: any[]; accounts?: any[] } = {}) => {
        const preloadedState: PreloadedState = {
            wallet: {
                trading: {
                    ...getInitializedTradingState(),
                    trades,
                },
                accounts:
                    accounts.length > 0
                        ? accounts
                        : [
                              {
                                  key: 'btc1',
                                  symbol: 'btc',
                                  deviceState: 'device1@test:123',
                                  descriptor: 'btc-descriptor',
                                  addresses: { unused: [{ address: 'btc-address' }] },
                                  visible: true,
                              },
                          ],
            },
            device: {
                selectedDevice: {
                    state: { staticSessionId: 'device1@test:123' },
                },
            },
        };

        return initStore(preloadedState).store;
    };

    const renderUseWatchTrade = (
        store: any,
        props: { accountKey?: AccountKey; orderId?: string; isInProgress?: boolean },
    ) =>
        renderHookWithStoreProvider(() => useWatchTradeWithReportSpy(props), {
            store,
        });

    describe('Trade Watching Behavior', () => {
        it('should not dispatch watch trade thunk when no trade is found', () => {
            const store = getInitializedStore();
            renderUseWatchTrade(store, {
                accountKey: btc1AccountKey,
                orderId: 'non-existent-order',
            });

            expect(mockWatchTradeThunk).not.toHaveBeenCalled();
        });

        it('should not dispatch watch trade thunk when no account is found', () => {
            const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
            const store = getInitializedStore({
                trades: [buyTrade],
            });

            renderUseWatchTrade(store, {
                accountKey: 'non-existent-account' as AccountKey, // Todo: create properly via `createAccountKey()`
                orderId: buyTrade.data.orderId,
            });

            expect(mockWatchTradeThunk).not.toHaveBeenCalled();
        });

        it('should dispatch watch trade thunk when trade and account are found', () => {
            const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
            const store = getInitializedStore({
                trades: [buyTrade],
            });

            renderUseWatchTrade(store, {
                accountKey: btc1AccountKey as AccountKey, // Todo: create properly via `createAccountKey()`
                orderId: buyTrade.data.orderId,
            });

            expect(mockWatchTradeThunk).toHaveBeenCalledWith({
                account: expect.objectContaining({ key: 'btc1' }),
                trade: buyTrade,
                refreshCount: 0,
            });
        });

        it('should dispatch watch trade thunk when shouldReload is true', () => {
            const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
            const store = getInitializedStore({
                trades: [buyTrade],
            });

            mockUseReloadTimer.mockReturnValue({
                timer: {
                    reset: jest.fn(),
                },
                shouldReload: true,
                resetCount: 1,
            });

            renderUseWatchTrade(store, {
                accountKey: btc1AccountKey,
                orderId: buyTrade.data.orderId,
            });

            expect(mockWatchTradeThunk).toHaveBeenCalledWith({
                account: expect.objectContaining({ key: 'btc1' }),
                trade: buyTrade,
                refreshCount: 1,
            });
        });

        it('should not dispatch watch trade thunk when trade is in final status', () => {
            const buyTrade = getBuyTrade({ status: 'SUCCESS' });
            const store = getInitializedStore({
                trades: [buyTrade],
            });

            renderUseWatchTrade(store, {
                accountKey: btc1AccountKey,
                orderId: buyTrade.data.orderId,
            });

            expect(mockWatchTradeThunk).not.toHaveBeenCalled();
        });
    });

    describe('Timer Management', () => {
        it('should use faster refresh rate when trade is in progress', () => {
            const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
            const store = getInitializedStore({
                trades: [buyTrade],
            });

            renderUseWatchTrade(store, {
                accountKey: btc1AccountKey,
                orderId: buyTrade.data.orderId,
                isInProgress: true,
            });

            expect(mockUseReloadTimer).toHaveBeenCalledWith({
                isEnabled: true,
                refreshLimitSeconds: 10,
            });
        });

        it('should use slower refresh rate when trade is not in progress', () => {
            const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
            const store = getInitializedStore({
                trades: [buyTrade],
            });

            renderUseWatchTrade(store, {
                accountKey: btc1AccountKey,
                orderId: buyTrade.data.orderId,
                isInProgress: false,
            });

            expect(mockUseReloadTimer).toHaveBeenCalledWith({
                isEnabled: true,
                refreshLimitSeconds: 30,
            });
        });

        it('should disable timer when trade is in final status', () => {
            const buyTrade = getBuyTrade({ status: 'SUCCESS' });
            const store = getInitializedStore({
                trades: [buyTrade],
            });

            renderUseWatchTrade(store, {
                accountKey: btc1AccountKey,
                orderId: buyTrade.data.orderId,
            });

            expect(mockUseReloadTimer).toHaveBeenCalledWith({
                isEnabled: false,
                refreshLimitSeconds: 30,
            });
        });
    });
});
