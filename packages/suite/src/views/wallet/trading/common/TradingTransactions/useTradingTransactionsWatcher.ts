import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { useDispatch } from '@suite-common/redux-utils';
import { tradingThunks } from '@suite-common/trading';
import { useFreshRef } from '@trezor/react-utils';

import { selectDeviceTradesToWatchByAccount } from 'src/selectors/wallet/tradesToWatchSelectors';

export const TRADING_TRANSACTIONS_REFRESH_INTERVAL_MS = 30_000;

export const useTradingTransactionsWatcher = () => {
    const tradesByAccount = useSelector(selectDeviceTradesToWatchByAccount);
    const dispatch = useDispatch();
    const tradesByAccountRef = useFreshRef(tradesByAccount);
    const isRefreshingRef = useRef(false);
    const refreshCountRef = useRef(0);

    useEffect(() => {
        let isActive = true;

        const refreshTrades = async () => {
            if (isRefreshingRef.current || tradesByAccountRef.current.length === 0) {
                return;
            }

            isRefreshingRef.current = true;
            const refreshCount = refreshCountRef.current;
            refreshCountRef.current += 1;

            try {
                for (const { account, trades } of tradesByAccountRef.current) {
                    for (const trade of trades) {
                        if (!isActive) {
                            return;
                        }

                        await dispatch(
                            tradingThunks.watchTradeThunk({ account, trade, refreshCount }),
                        );
                    }
                }
            } finally {
                isRefreshingRef.current = false;
            }
        };

        refreshTrades();
        const interval = setInterval(refreshTrades, TRADING_TRANSACTIONS_REFRESH_INTERVAL_MS);

        return () => {
            isActive = false;
            clearInterval(interval);
        };
    }, [dispatch, tradesByAccountRef]);
};
