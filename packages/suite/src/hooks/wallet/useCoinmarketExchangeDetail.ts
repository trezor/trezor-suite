import { createContext, useContext } from 'react';
import { Props, ContextValues } from '@wallet-types/coinmarketExchangeDetail';
import { useWatchExchangeTrade } from '@wallet-hooks/useCoinmarket';
import { useSelector } from '@suite-hooks';
import { TradeExchange } from '@wallet-types/coinmarketCommonTypes';
import invityAPI from '@suite-services/invityAPI';

export const useCoinmarketExchangeDetail = (props: Props) => {
    const { selectedAccount, trades, transactionId } = props;
    const exchangeTrade = trades.find(
        trade => trade.tradeType === 'exchange' && trade.key === transactionId,
    ) as TradeExchange;
    const { account } = selectedAccount;
    const invityServerEnvironment = useSelector(
        state => state.suite.settings.debug.invityServerEnvironment,
    );
    if (invityServerEnvironment) {
        invityAPI.setInvityServersEnvironment(invityServerEnvironment);
    }
    const exchangeInfo = useSelector(state => state.wallet.coinmarket.exchange.exchangeInfo);
    useWatchExchangeTrade(account, exchangeTrade);

    return {
        account,
        trade: exchangeTrade,
        transactionId,
        exchangeInfo,
    };
};

export const CoinmarketExchangeDetailContext = createContext<ContextValues | null>(null);
CoinmarketExchangeDetailContext.displayName = 'CoinmarketExchangeDetailContext';

export const useCoinmarketExchangeDetailContext = () => {
    const context = useContext(CoinmarketExchangeDetailContext);
    if (context === null) throw Error('CoinmarketExchangeDetailContext used without Context');
    return context;
};
