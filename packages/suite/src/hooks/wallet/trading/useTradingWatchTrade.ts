import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTimeoutFn, useUnmount } from 'react-use';

import {
    BuyTradeFinalStatus,
    ExchangeTradeFinalStatus,
    SellTradeFinalStatus,
    WatchBuyTradeResponse,
    WatchExchangeTradeResponse,
    WatchSellTradeResponse,
} from 'invity-api';

import { type TradingType, invityAPI } from '@suite-common/trading';

import { saveTrade as saveBuyTrade } from 'src/actions/wallet/tradingBuyActions';
import { saveTrade as saveExchangeTrade } from 'src/actions/wallet/tradingExchangeActions';
import { saveTrade as saveSellTrade } from 'src/actions/wallet/tradingSellActions';
import { useFormDraft } from 'src/hooks/wallet/useFormDraft';
import {
    TradingTradeStatusType,
    TradingUseWatchTradeProps,
    TradingWatchTradeProps,
} from 'src/types/trading/trading';
import { Trade, TradeType } from 'src/types/wallet/tradingCommonTypes';

export const tradeFinalStatuses: Record<TradeType, TradingTradeStatusType[]> = {
    buy: ['SUCCESS', 'ERROR', 'BLOCKED'] satisfies BuyTradeFinalStatus[],
    sell: ['SUCCESS', 'ERROR', 'BLOCKED', 'CANCELLED', 'REFUNDED'] satisfies SellTradeFinalStatus[],
    exchange: ['SUCCESS', 'ERROR', 'KYC'] satisfies ExchangeTradeFinalStatus[],
};

const shouldRefreshTrade = (trade: Trade | undefined) =>
    trade && trade.data.status && !tradeFinalStatuses[trade.tradeType].includes(trade.data.status);

const tradingWatchTrade = async <T extends TradingType>({
    trade,
    account,
    refreshCount,
    dispatch,
    removeDraft,
}: TradingWatchTradeProps<T>) => {
    const response = await invityAPI.watchTrade<T>(trade.data, trade.tradeType, refreshCount);
    if (!response) return;
    if (response.status && response.status !== trade.data.status) {
        const newDate = new Date().toISOString();

        if (trade.tradeType === 'buy') {
            const buyResponse = response as WatchBuyTradeResponse;
            const tradeData = {
                ...trade.data,
                status: buyResponse.status,
                error: buyResponse.error,
            };

            dispatch(saveBuyTrade(tradeData, account, newDate));
        }

        if (trade.tradeType === 'sell') {
            const sellResponse = response as WatchSellTradeResponse;
            const tradeData = {
                ...trade.data,
                status: sellResponse.status,
                error: sellResponse.error,
            };

            if (sellResponse.destinationAddress) {
                tradeData.destinationAddress = sellResponse.destinationAddress;
                tradeData.destinationPaymentExtraId = sellResponse.destinationPaymentExtraId;
            }

            if (sellResponse.cryptoStringAmount) {
                tradeData.cryptoStringAmount = sellResponse.cryptoStringAmount;
            }

            dispatch(saveSellTrade(tradeData, account, newDate));
        }

        if (trade.tradeType === 'exchange') {
            const exchangeResponse = response as WatchExchangeTradeResponse;
            const tradeData = {
                ...trade.data,
                status: exchangeResponse.status,
                error: exchangeResponse.error,
            };

            if (exchangeResponse.sendAddress) {
                tradeData.sendAddress = exchangeResponse.sendAddress;
                tradeData.partnerPaymentExtraId = exchangeResponse.partnerPaymentExtraId;
            }

            dispatch(saveExchangeTrade(tradeData, account, newDate));
        }
    }

    if (response.status && tradeFinalStatuses[trade.tradeType].includes(response.status)) {
        removeDraft(account.key);
    }
};

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

    useEffect(() => {
        if (!trade || !account) return;

        if (shouldRefreshTrade(trade)) {
            cancelRefresh();
            invityAPI.createInvityAPIKey(account.descriptor);
            tradingWatchTrade<T>({ trade, account, refreshCount, dispatch, removeDraft });

            resetRefresh();
        }
    }, [account, trade, refreshCount, cancelRefresh, dispatch, removeDraft, resetRefresh]);
};
