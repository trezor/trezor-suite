import { createContext, useContext } from 'react';
import { Props, ContextValues } from '@wallet-types/coinmarketBuyDetail';
import { useWatchBuyTrade } from '@wallet-hooks/useCoinmarket';
import { useSelector } from '@suite-hooks';
import invityAPI from '@suite-services/invityAPI';
import { TradeBuy } from '@wallet-reducers/coinmarketReducer';

export const useCoinmarketBuyDetail = (props: Props) => {
    const { selectedAccount, trades, transactionId } = props;
    const buyTrade = trades.find(
        trade =>
            trade.tradeType === 'buy' &&
            (trade.key === transactionId || trade.data?.originalPaymentId === transactionId),
    );
    const { account } = selectedAccount;
    const { invityAPIUrl, buyInfo } = useSelector(state => ({
        invityAPIUrl: state.suite.settings.debug.invityAPIUrl,
        buyInfo: state.wallet.coinmarket.buy.buyInfo,
    }));
    if (invityAPIUrl) {
        invityAPI.setInvityAPIServer(invityAPIUrl);
    }

    useWatchBuyTrade(account, buyTrade as TradeBuy);

    return {
        account,
        trade: buyTrade,
        transactionId,
        buyInfo,
    };
};

export const CoinmarketBuyDetailContext = createContext<ContextValues | null>(null);
CoinmarketBuyDetailContext.displayName = 'CoinmarketBuyDetailContext';

export const useCoinmarketBuyDetailContext = () => {
    const context = useContext(CoinmarketBuyDetailContext);
    if (context === null) throw Error('CoinmarketBuyDetailContext used without Context');
    return context;
};
