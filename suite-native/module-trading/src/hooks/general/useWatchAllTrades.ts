import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import {
    type TradingRootStateWithDeviceAndAccounts,
    selectDeviceTradingTrades,
} from '@suite-common/trading';

import { useAllTradesReloadTimer } from './useAllTradesReloadTimer';
import { useTransactionStateChangeAnalyticsReporting } from './useTransactionStateChangeAnalyticsReporting';

type UseWatchAllTradesProps = {
    isEnabled?: boolean;
};

export const useWatchAllTrades = ({ isEnabled = true }: UseWatchAllTradesProps = {}) => {
    const deviceTrades = useSelector((state: TradingRootStateWithDeviceAndAccounts) =>
        selectDeviceTradingTrades(state),
    );

    // Use the analytics reporting hook
    useTransactionStateChangeAnalyticsReporting(deviceTrades);

    // Use the all trades reload timer hook
    const {
        refreshAllTrades,
        shouldReload,
        hasFetchedInitialTrades,
        isFetching,
        setIsFetching,
        tradesToWatch,
    } = useAllTradesReloadTimer({ isEnabled });

    // Refresh all relevant trades when they need refreshing
    useEffect(() => {
        if (!isEnabled) {
            return;
        }

        if ((!hasFetchedInitialTrades || shouldReload) && !isFetching) {
            setIsFetching(true);
            const refreshTrades = async () => {
                await refreshAllTrades();
                setIsFetching(false);
            };
            refreshTrades();
        }
    }, [
        tradesToWatch,
        shouldReload,
        hasFetchedInitialTrades,
        refreshAllTrades,
        isFetching,
        setIsFetching,
        isEnabled,
    ]);

    return {
        allTrades: deviceTrades,
        tradesToWatch,

        totalTrades: deviceTrades.length,
        tradesWatching: tradesToWatch.length,
        // Manual refresh function
        manualRefresh: refreshAllTrades,
    };
};
