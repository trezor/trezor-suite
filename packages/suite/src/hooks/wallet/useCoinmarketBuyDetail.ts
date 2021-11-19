import { createContext, useContext } from 'react';
import { Props, ContextValues } from '@wallet-types/coinmarketBuyDetail';
import { useWatchBuyTrade } from '@wallet-hooks/useCoinmarket';
import { useSelector } from '@suite-hooks';
import invityAPI from '@suite-services/invityAPI';
import { TradeBuy } from '@wallet-types/coinmarketCommonTypes';

export const useCoinmarketBuyDetail = (props: Props) => {
    const { selectedAccount, trades, transactionId } = props;
    const buyTrade = trades.find(
        trade =>
            trade.tradeType === 'buy' &&
            (trade.key === transactionId || trade.data?.originalPaymentId === transactionId),
    ) as TradeBuy;
    const { account } = selectedAccount;
    const { invityServerEnvironment, buyInfo } = useSelector(state => ({
        invityServerEnvironment: state.suite.settings.debug.invityServerEnvironment,
        buyInfo: state.wallet.coinmarket.buy.buyInfo,
    }));
    if (invityServerEnvironment) {
        invityAPI.setInvityServersEnvironment(invityServerEnvironment);
    }

    useWatchBuyTrade(account, buyTrade);

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
