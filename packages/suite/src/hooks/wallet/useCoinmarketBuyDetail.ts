import { createContext, useContext, useEffect, useState } from 'react';
import { useUnmount, useTimeoutFn } from 'react-use';
import invityAPI from '@suite-services/invityAPI';
import { Props, ContextValues } from '@wallet-types/coinmarketBuyDetail';
import { TradeBuy } from '@wallet-reducers/coinmarketReducer';
import { BuyTradeStatus } from 'invity-api';
import * as coinmarketBuyActions from '@wallet-actions/coinmarketBuyActions';
import { useActions } from '../suite/useActions';

const REFRESH_SECONDS = 30;

// TODO - will be taken from invityAPI in the future
export const BuyTradeFinalStatuses: BuyTradeStatus[] = ['SUCCESS', 'ERROR', 'BLOCKED'];

export const useCoinmarketBuyDetail = (props: Props) => {
    const { selectedAccount, trades, transactionId } = props;
    const { account } = selectedAccount;
    const trade: TradeBuy | undefined = trades.find(
        trade => trade.tradeType === 'buy' && trade.key === transactionId,
    );

    invityAPI.createInvityAPIKey(account.descriptor);

    const { saveTrade } = useActions({ saveTrade: coinmarketBuyActions.saveTrade });
    const shouldRefresh = () => {
        return trade && trade.data.status && !BuyTradeFinalStatuses.includes(trade.data.status);
    };
    const [refreshCount, setRefreshCount] = useState(0);
    const invokeRefresh = () => {
        if (shouldRefresh()) {
            setRefreshCount(prevValue => prevValue + 1);
        }
    };
    const [, cancelRefresh, resetRefresh] = useTimeoutFn(invokeRefresh, REFRESH_SECONDS * 1000);
    useUnmount(() => {
        cancelRefresh();
    });
    useEffect(() => {
        if (trade && shouldRefresh()) {
            cancelRefresh();
            invityAPI.watchBuyTrade(trade.data, refreshCount).then(response => {
                if (response.status && response.status !== trade.data.status) {
                    // TODO - persist trade
                    saveTrade(
                        { ...trade.data, status: response.status, error: response.error },
                        account,
                        new Date().toISOString(),
                    );
                }
            });
            resetRefresh();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshCount]);

    return {
        account,
        trade,
        transactionId,
    };
};

export const CoinmarketBuyDetailContext = createContext<ContextValues | null>(null);
CoinmarketBuyDetailContext.displayName = 'CoinmarketBuyDetailContext';

export const useCoinmarketBuyDetailContext = () => {
    const context = useContext(CoinmarketBuyDetailContext);
    if (context === null) throw Error('CoinmarketBuyDetailContext used without Context');
    return context;
};
