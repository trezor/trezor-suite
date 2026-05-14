import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

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
import { events } from '@suite-native/analytics';
import { useAnalytics } from '@suite-native/services';
import { type TradingRootState } from '@suite-native/trading-state';

import { useReloadTimer } from './useReloadTimer';
import { getTradeStatusStep } from '../../utils/general/utils';

export type TradingTradeMapProps = {
    buy: TradingTransactionBuy;
    sell: TradingTransactionSell;
    exchange: TradingTransactionExchange;
};

export interface TradingUseWatchTradeProps {
    accountKey: AccountKey | undefined;
    orderId: string | undefined;
    isInProgress: boolean;
}
const REFRESH_SECONDS_BASE = 30;
const REFRESH_SECONDS_IN_PROGRESS = 10;

export const shouldRefreshTrade = (trade: TradingTransaction | undefined) =>
    trade && trade.data.status && !tradeFinalStatuses[trade.tradeType].includes(trade.data.status);

export const useWatchTrade = ({ accountKey, orderId, isInProgress }: TradingUseWatchTradeProps) => {
    const dispatch = useDispatch();
    const analytics = useAnalytics();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const trade = useSelector((state: TradingRootState) =>
        selectTradingTradeByOrderId(state, orderId),
    );
    const shouldRefresh = useMemo(() => shouldRefreshTrade(trade), [trade]);
    const { timer, shouldReload, resetCount } = useReloadTimer({
        isEnabled: shouldRefresh,
        refreshLimitSeconds: isInProgress ? REFRESH_SECONDS_IN_PROGRESS : REFRESH_SECONDS_BASE,
    });
    const [hasRefreshed, setHasRefreshed] = useState(false);
    const previousStatus = useRef<ReturnType<typeof getTradeStatusStep>>(undefined);
    const { reset } = timer;

    useEffect(() => {
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
    }, [trade, account, previousStatus, analytics]);

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
