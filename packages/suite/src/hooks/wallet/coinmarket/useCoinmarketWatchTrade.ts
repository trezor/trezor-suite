import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTimeoutFn, useUnmount } from 'react-use';
import { Trade, TradeType } from 'src/types/wallet/coinmarketCommonTypes';
import invityAPI from 'src/services/suite/invityAPI';
import { saveTrade as saveBuyTrade } from 'src/actions/wallet/coinmarketBuyActions';
import { saveTrade as saveExchangeTrade } from 'src/actions/wallet/coinmarketExchangeActions';
import { saveTrade as saveSellTrade } from 'src/actions/wallet/coinmarketSellActions';
import {
    BuyTradeFinalStatus,
    ExchangeTradeFinalStatus,
    SellTradeFinalStatus,
    WatchBuyTradeResponse,
    WatchExchangeTradeResponse,
    WatchSellTradeResponse,
} from 'invity-api';
import {
    CoinmarketTradeStatusType,
    CoinmarketTradeType,
    CoinmarketUseWatchTradeProps,
    CoinmarketWatchTradeProps,
} from 'src/types/coinmarket/coinmarket';
import { useFormDraft } from 'src/hooks/wallet/useFormDraft';

export const tradeFinalStatuses: Record<TradeType, CoinmarketTradeStatusType[]> = {
    buy: ['SUCCESS', 'ERROR', 'BLOCKED'] satisfies BuyTradeFinalStatus[],
    sell: ['SUCCESS', 'ERROR', 'BLOCKED', 'CANCELLED', 'REFUNDED'] satisfies SellTradeFinalStatus[],
    exchange: ['SUCCESS', 'ERROR', 'KYC'] satisfies ExchangeTradeFinalStatus[],
};

const shouldRefreshTrade = (trade: Trade | undefined) =>
    trade && trade.data.status && !tradeFinalStatuses[trade.tradeType].includes(trade.data.status);

const coinmarketWatchTrade = async <T extends CoinmarketTradeType>({
    trade,
    account,
    refreshCount,
    dispatch,
    removeDraft,
}: CoinmarketWatchTradeProps<T>) => {
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

            dispatch(saveSellTrade(tradeData, account, newDate));
        }

        if (trade.tradeType === 'exchange') {
            const exchangeResponse = response as WatchExchangeTradeResponse;
            const tradeData = {
                ...trade.data,
                status: exchangeResponse.status,
                error: exchangeResponse.error,
            };

            dispatch(saveExchangeTrade(tradeData, account, newDate));
        }
    }

    if (response.status && tradeFinalStatuses[trade.tradeType].includes(response.status)) {
        removeDraft(account.key);
    }
};

export const useCoinmarketWatchTrade = <T extends CoinmarketTradeType>({
    account,
    trade,
}: CoinmarketUseWatchTradeProps<T>) => {
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

    const { removeDraft } = useFormDraft(`coinmarket-${trade?.tradeType ?? 'buy'}`);

    useEffect(() => {
        if (!trade || !account) return;

        if (shouldRefreshTrade(trade)) {
            cancelRefresh();
            invityAPI.createInvityAPIKey(account.descriptor);
            coinmarketWatchTrade<T>({ trade, account, refreshCount, dispatch, removeDraft });

            resetRefresh();
        }
    }, [account, trade, refreshCount, cancelRefresh, dispatch, removeDraft, resetRefresh]);
};
