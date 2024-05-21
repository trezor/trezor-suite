import { useEffect, useState } from 'react';
import { ExchangeTradeStatus, SellTradeStatus } from 'invity-api';
import useUnmount from 'react-use/lib/useUnmount';
import useTimeoutFn from 'react-use/lib/useTimeoutFn';
import { useDispatch } from 'src/hooks/suite';
import invityAPI from 'src/services/suite/invityAPI';
import { saveTrade as saveExchangeTrade } from 'src/actions/wallet/coinmarketExchangeActions';
import { Account } from 'src/types/wallet';
import type { TradeExchange } from 'src/types/wallet/coinmarketCommonTypes';
import { useFormDraft } from 'src/hooks/wallet/useFormDraft';

export const ExchangeTradeFinalStatuses: ExchangeTradeStatus[] = ['SUCCESS', 'ERROR', 'KYC'];

const shouldRefreshExchangeTrade = (trade?: TradeExchange) =>
    trade && trade.data.status && !ExchangeTradeFinalStatuses.includes(trade.data.status);

export const useWatchExchangeTrade = (account: Account, trade: TradeExchange) => {
    const REFRESH_SECONDS = 30;
    const dispatch = useDispatch();
    const [refreshCount, setRefreshCount] = useState(0);
    const invokeRefresh = () => {
        if (shouldRefreshExchangeTrade(trade)) {
            setRefreshCount(prevValue => prevValue + 1);
        }
    };
    const [, cancelRefresh, resetRefresh] = useTimeoutFn(invokeRefresh, REFRESH_SECONDS * 1000);

    useUnmount(() => {
        cancelRefresh();
    });

    const { removeDraft } = useFormDraft('coinmarket-exchange');

    useEffect(() => {
        if (trade && shouldRefreshExchangeTrade(trade)) {
            cancelRefresh();
            invityAPI.createInvityAPIKey(account.descriptor);
            invityAPI.watchExchangeTrade(trade.data, refreshCount).then(response => {
                if (response.status && response.status !== trade.data.status) {
                    const newDate = new Date().toISOString();
                    const tradeData = {
                        ...trade.data,
                        status: response.status,
                        error: response.error,
                    };
                    dispatch(saveExchangeTrade(tradeData, account, newDate));
                }
                if (response.status && ExchangeTradeFinalStatuses.includes(response.status)) {
                    removeDraft(account.key);
                }
            });
            resetRefresh();
        }
    }, [account, cancelRefresh, dispatch, refreshCount, removeDraft, resetRefresh, trade]);
};

export const SellFiatTradeFinalStatuses: SellTradeStatus[] = [
    'SUCCESS',
    'ERROR',
    'BLOCKED',
    'CANCELLED',
    'REFUNDED',
];
