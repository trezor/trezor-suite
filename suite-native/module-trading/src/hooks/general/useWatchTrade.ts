import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { useDispatch } from '@suite-common/redux-utils';
import {
    type TradingTransaction,
    type TradingTransactionBuy,
    type TradingTransactionExchange,
    type TradingTransactionSell,
    selectTradingTradeByOrderId,
    tradeFinalStatuses,
    tradingThunks,
} from '@suite-common/trading';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { getTradeStatusStep } from '@suite-native/trading-quote-utils';
import { type TradingRootState } from '@suite-native/trading-state';

import { useReloadTimer } from './useReloadTimer';

export type TradingTradeMapProps = {
    buy: TradingTransactionBuy;
    sell: TradingTransactionSell;
    exchange: TradingTransactionExchange;
};

export interface TradingUseWatchTradeProps {
    accountKey: AccountKey | undefined;
    orderId: string | undefined;
    isInProgress: boolean;
    isEnabled?: boolean;
    shouldReportAnalytics?: boolean;
}
const REFRESH_SECONDS_BASE = 30;
const REFRESH_SECONDS_IN_PROGRESS = 10;

export const shouldRefreshTrade = (trade: TradingTransaction | undefined) =>
    trade?.data.status && !tradeFinalStatuses[trade.tradeType].includes(trade.data.status);

export const useWatchTrade = ({
    accountKey,
    orderId,
    isInProgress,
    isEnabled = true,
    shouldReportAnalytics = true,
}: TradingUseWatchTradeProps) => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const trade = useSelector((state: TradingRootState) =>
        selectTradingTradeByOrderId(state, orderId),
    );
    const shouldRefresh = useMemo(() => isEnabled && shouldRefreshTrade(trade), [isEnabled, trade]);
    const { timer, shouldReload, resetCount } = useReloadTimer({
        isEnabled: shouldRefresh,
        refreshLimitSeconds: isInProgress ? REFRESH_SECONDS_IN_PROGRESS : REFRESH_SECONDS_BASE,
    });
    const [hasRefreshed, setHasRefreshed] = useState(false);
    const previousStatus = useRef<ReturnType<typeof getTradeStatusStep>>(undefined);
    const { reset } = timer;

    useEffect(() => {
        if (!shouldReportAnalytics) {
            return;
        }

        const currentStatus = getTradeStatusStep(trade);
        if (currentStatus !== previousStatus.current) {
            previousStatus.current = currentStatus;

            if (trade && currentStatus) {
                analytics.report({
                    type: events.tradingStatusEvent.name,
                    payload: { type: trade.tradeType, status: currentStatus },
                });
            }
        }
    }, [trade, account, previousStatus, analytics, shouldReportAnalytics]);

    useEffect(() => {
        if (!shouldRefresh) {
            setHasRefreshed(false);
        }
    }, [shouldRefresh]);

    useEffect(() => {
        if (trade && account && (!hasRefreshed || shouldReload) && shouldRefresh) {
            if (!hasRefreshed) {
                setHasRefreshed(true);
            }
            dispatch(
                tradingThunks.watchTradeThunk({
                    account,
                    trade,
                    refreshCount: resetCount,
                }),
            );
            reset();
        }
    }, [account, trade, resetCount, dispatch, shouldReload, reset, hasRefreshed, shouldRefresh]);
};
