import { useCallback, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { tradingThunks } from '@suite-common/trading';

import { useReloadTimer } from './useReloadTimer';
import { selectTradesToWatchByAccount } from '../../selectors/commonSelectors';

const REFRESH_SECONDS = 120;

export const useAllTradesReloadTimer = () => {
    const dispatch = useDispatch();

    // For initial refresh
    const [hasFetchedInitialTrades, setHasFetchedInitialTrades] = useState(false);

    // For preventing multiple calls to refreshAllTrades
    const isFetchingRef = useRef(false);

    const { tradesByAccount, tradesToWatch } = useSelector(selectTradesToWatchByAccount);

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
