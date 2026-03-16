import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTimeoutFn, useUnmount } from 'react-use';

import {
    type BuyTradeFinalStatus,
    type ExchangeTradeFinalStatus,
    type SellTradeFinalStatus,
} from 'invity-api';

import {
    type TradingTradeStatusType,
    type TradingTransaction,
    type TradingType,
    tradingThunks,
} from '@suite-common/trading';
import { useFormDraft } from '@suite-common/wallet-core';

import { type TradingUseWatchTradeProps } from 'src/types/trading/trading';

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

    const prefix = `trading-${trade?.tradeType ?? 'buy'}` as const;
    const key = trade?.tradeType === 'buy' ? account?.key : undefined;
    const { removeDraft } = useFormDraft(prefix, key);

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
                removeDraft();
            }

            resetRefresh();
        } else {
            removeDraft();
        }
    }, [account, refreshCount, trade, cancelRefresh, dispatch, removeDraft, resetRefresh]);

    useEffect(() => {
        watchTrade();
    }, [watchTrade]);
};
