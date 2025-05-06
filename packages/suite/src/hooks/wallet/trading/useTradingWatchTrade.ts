import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTimeoutFn, useUnmount } from 'react-use';

import { BuyTradeFinalStatus, ExchangeTradeFinalStatus, SellTradeFinalStatus } from 'invity-api';

import {
    type TradingTradeStatusType,
    type TradingTransaction,
    type TradingType,
    tradingThunks,
} from '@suite-common/trading';

import { useFormDraft } from 'src/hooks/wallet/useFormDraft';
import { TradingUseWatchTradeProps } from 'src/types/trading/trading';

export const tradeFinalStatuses: Record<TradingType, TradingTradeStatusType[]> = {
    buy: ['SUCCESS', 'ERROR', 'BLOCKED'] satisfies BuyTradeFinalStatus[],
    sell: ['SUCCESS', 'ERROR', 'BLOCKED', 'CANCELLED', 'REFUNDED'] satisfies SellTradeFinalStatus[],
    exchange: ['SUCCESS', 'ERROR', 'KYC'] satisfies ExchangeTradeFinalStatus[],
};

const shouldRefreshTrade = (trade: TradingTransaction | undefined) =>
    trade && trade.data.status && !tradeFinalStatuses[trade.tradeType].includes(trade.data.status);

export const useTradingWatchTrade = <T extends TradingType>({
    account,
    trade,
}: TradingUseWatchTradeProps<T>) => {
    const REFRESH_SECONDS = 30;
    const dispatch = useDispatch();
    const [refreshCount, setRefreshCount] = useState(0);
    const invokeRefresh = () => {
        if (shouldRefreshTrade(trade)) {
            setRefreshCount(prevValue => prevValue + 1);
        }
    };
    const [, cancelRefresh, resetRefresh] = useTimeoutFn(invokeRefresh, REFRESH_SECONDS * 1000);

    useUnmount(() => {
        cancelRefresh();
    });

    const { removeDraft } = useFormDraft(`trading-${trade?.tradeType ?? 'buy'}`);

    const watchTrade = useCallback(async () => {
        if (!trade || !account) return;

        if (shouldRefreshTrade(trade)) {
            cancelRefresh();

            await dispatch(
                tradingThunks.watchTradeThunk({
                    account,
                    trade,
                    refreshCount,
                }),
            );

            if (
                trade.data.status &&
                tradeFinalStatuses[trade.tradeType].includes(trade.data.status)
            ) {
                removeDraft(account.key);
            }

            resetRefresh();
        }
    }, [account, refreshCount, trade, cancelRefresh, dispatch, removeDraft, resetRefresh]);

    useEffect(() => {
        watchTrade();
    }, [watchTrade]);
};
