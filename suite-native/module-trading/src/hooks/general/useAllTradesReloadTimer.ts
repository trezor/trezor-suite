import { useCallback, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    TradingRootStateWithDeviceAndAccounts,
    TradingTransaction,
    selectDeviceTradingTrades,
    tradeFinalStatuses,
    tradingThunks,
} from '@suite-common/trading';
import { selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';

import { useReloadTimer } from './useReloadTimer';

const REFRESH_SECONDS = 120;

// Helper function to determine if a trade needs watching
const shouldRefreshTrade = (trade: TradingTransaction) =>
    trade && trade.data.status && !tradeFinalStatuses[trade.tradeType].includes(trade.data.status);

export const useAllTradesReloadTimer = () => {
    const dispatch = useDispatch();

    // For initial refresh
    const [hasFetchedInitialTrades, setHasFetchedInitialTrades] = useState(false);

    // For preventing multiple calls to refreshAllTrades
    const isFetchingRef = useRef(false);

    const deviceTrades = useSelector((state: TradingRootStateWithDeviceAndAccounts) =>
        selectDeviceTradingTrades(state),
    );

    const visibleAccounts = useSelector(selectVisibleDeviceAccounts);

    const tradesToWatch = deviceTrades.filter(trade => shouldRefreshTrade(trade));

    const tradesByAccount = useMemo(() => {
        const grouped: Record<string, { account: Account; trades: TradingTransaction[] }> = {};

        tradesToWatch.forEach(trade => {
            const tradeKey =
                'selectedAccountKey' in trade ? trade.selectedAccountKey : trade.sendAccountKey;
            const account = visibleAccounts.find(acc => acc.key === tradeKey);

            if (account) {
                if (!grouped[account.key]) {
                    grouped[account.key] = { account, trades: [] };
                }
                grouped[account.key].trades.push(trade);
            }
        });

        return Object.values(grouped);
    }, [tradesToWatch, visibleAccounts]);

    const { timer, shouldReload, resetCount } = useReloadTimer({
        isEnabled: tradesToWatch.length > 0,
        refreshLimitSeconds: REFRESH_SECONDS,
    });

    const { reset } = timer;

    // Function to refresh all trades that need watching
    const refreshAllTrades = useCallback(async () => {
        if (tradesToWatch.length === 0) {
            return;
        }

        // Refresh all trades that need watching
        for (const { account, trades } of tradesByAccount) {
            for (const trade of trades) {
                await dispatch(
                    tradingThunks.watchTradeThunk({
                        account,
                        trade,
                        refreshCount: resetCount,
                    }),
                );
            }
        }

        if (!hasFetchedInitialTrades) {
            setHasFetchedInitialTrades(true);
        }
        reset();
    }, [tradesToWatch, tradesByAccount, dispatch, resetCount, hasFetchedInitialTrades, reset]);

    return {
        refreshAllTrades,
        shouldReload,
        hasFetchedInitialTrades,
        isFetching: isFetchingRef.current,
        setIsFetching: (value: boolean) => {
            isFetchingRef.current = value;
        },
        tradesToWatch,
        tradesByAccount,
    };
};
