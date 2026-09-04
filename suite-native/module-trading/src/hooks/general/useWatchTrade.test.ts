import React from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { type NativeAnalyticsDep, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { type TestStore } from '@suite-native/test-utils-store';
import { getBuyTrade } from '@suite-native/trading-fixtures';

import { useWatchTrade } from './useWatchTrade';
import {
    createTradingLightStore,
    renderHookWithTradingProvider,
} from '../../test-utils/tradingTestUtils';

jest.mock('./useReloadTimer', () => ({
    useReloadTimer: jest.fn(),
}));

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    tradingThunks: {
        watchTradeThunk: jest.fn(() => ({ type: 'watchTradeThunk' })),
    },
}));

const btcSymbol = asNetworkSymbol('btc');

const mockWatchTradeThunk = require('@suite-common/trading').tradingThunks.watchTradeThunk;

const mockUseReloadTimer = require('./useReloadTimer').useReloadTimer;

type ReportSpy = jest.SpyInstance;

const useWatchTradeWithReportSpy = (props: {
    accountKey?: AccountKey;
    orderId?: string;
    isInProgress?: boolean;
}) => {
    const { analytics } = useServices(selectNativeAnalyticsDep);
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

const btc1AccountKey = mockAccountKey({ symbol: btcSymbol, descriptor: 'btc1' });
const services: NativeAnalyticsDep = {
    analytics: mockNativeAnalytics(),
};

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
    }: { trades?: any[]; accounts?: any[] } = {}) =>
        createTradingLightStore({
            overrides: {
                wallet: {
                    trading: { trades },
                    accounts:
                        accounts.length > 0
                            ? accounts
                            : [
                                  {
                                      key: btc1AccountKey,
                                      symbol: btcSymbol,
                                      deviceState:
                                          'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@448CCE89D32A733A1632F345:0',
                                      descriptor: 'btc1',
                                      addresses: { unused: [{ address: 'btc-address' }] },
                                      visible: true,
                                  },
                              ],
                },
                device: {
                    selectedDevice: {
                        state: {
                            staticSessionId:
                                'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@448CCE89D32A733A1632F345:0',
                        },
                    },
                },
            },
        });

    const renderUseWatchTrade = async (
        store: TestStore,
        props: { accountKey?: AccountKey; orderId?: string; isInProgress?: boolean },
    ) =>
        await renderHookWithTradingProvider(() => useWatchTradeWithReportSpy(props), {
            store,
            services,
        });

    describe('Trade Watching Behavior', () => {
        it('should not dispatch watch trade thunk when no trade is found', async () => {
            const store = getInitializedStore();
            await renderUseWatchTrade(store, {
                accountKey: btc1AccountKey,
                orderId: 'non-existent-order',
            });

            expect(mockWatchTradeThunk).not.toHaveBeenCalled();
        });

        it('should not dispatch watch trade thunk when no account is found', async () => {
            const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
            const store = getInitializedStore({
                trades: [buyTrade],
            });

            await renderUseWatchTrade(store, {
                accountKey: mockAccountKey({ descriptor: 'nonExistentAccount' }),
                orderId: buyTrade.data.orderId,
            });

            expect(mockWatchTradeThunk).not.toHaveBeenCalled();
        });

        it('should dispatch watch trade thunk when trade and account are found', async () => {
            const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
            const store = getInitializedStore({
                trades: [buyTrade],
            });

            await renderUseWatchTrade(store, {
                accountKey: btc1AccountKey,
                orderId: buyTrade.data.orderId,
            });

            expect(mockWatchTradeThunk).toHaveBeenCalledWith({
                account: expect.objectContaining({ key: btc1AccountKey }),
                trade: buyTrade,
                refreshCount: 0,
            });
        });

        it('should dispatch watch trade thunk when shouldReload is true', async () => {
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

            await renderUseWatchTrade(store, {
                accountKey: btc1AccountKey,
                orderId: buyTrade.data.orderId,
            });

            expect(mockWatchTradeThunk).toHaveBeenCalledWith({
                account: expect.objectContaining({ key: btc1AccountKey }),
                trade: buyTrade,
                refreshCount: 1,
            });
        });

        it('should not dispatch watch trade thunk when trade is in final status', async () => {
            const buyTrade = getBuyTrade({ status: 'SUCCESS' });
            const store = getInitializedStore({
                trades: [buyTrade],
            });

            await renderUseWatchTrade(store, {
                accountKey: btc1AccountKey,
                orderId: buyTrade.data.orderId,
            });

            expect(mockWatchTradeThunk).not.toHaveBeenCalled();
        });
    });

    describe('Timer Management', () => {
        it('should use faster refresh rate when trade is in progress', async () => {
            const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
            const store = getInitializedStore({
                trades: [buyTrade],
            });

            await renderUseWatchTrade(store, {
                accountKey: btc1AccountKey,
                orderId: buyTrade.data.orderId,
                isInProgress: true,
            });

            expect(mockUseReloadTimer).toHaveBeenCalledWith({
                isEnabled: true,
                refreshLimitSeconds: 10,
            });
        });

        it('should use slower refresh rate when trade is not in progress', async () => {
            const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
            const store = getInitializedStore({
                trades: [buyTrade],
            });

            await renderUseWatchTrade(store, {
                accountKey: btc1AccountKey,
                orderId: buyTrade.data.orderId,
                isInProgress: false,
            });

            expect(mockUseReloadTimer).toHaveBeenCalledWith({
                isEnabled: true,
                refreshLimitSeconds: 30,
            });
        });

        it('should disable timer when trade is in final status', async () => {
            const buyTrade = getBuyTrade({ status: 'SUCCESS' });
            const store = getInitializedStore({
                trades: [buyTrade],
            });

            await renderUseWatchTrade(store, {
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
