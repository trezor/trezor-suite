import { createContext, useContext } from 'react';
import useSWR from 'swr';
import invityAPI from '@suite-services/invityAPI';
import { Props, ContextValues } from '@wallet-types/coinmarketBuyDetail';
import { TradeBuy } from '@wallet-reducers/coinmarketReducer';

export const useCoinmarketDetail = (props: Props) => {
    const { selectedAccount, trades, transactionId } = props;
    const { account } = selectedAccount;
    const trade: TradeBuy | undefined = trades.find(
        trade => trade.tradeType === 'buy' && trade.key === transactionId,
    );

    invityAPI.createInvityAPIKey(account.descriptor);
    const fetcher = () => (trade ? invityAPI.watchBuyTrade(trade.data, 1) : null);
    const { data } = useSWR('/invity-api/watch-buy-trade', fetcher);

    return {
        account,
        trade,
        tradeStatus: data && data.status ? data.status : trade?.data.status,
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
