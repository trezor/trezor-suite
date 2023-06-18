import { createContext, useContext } from 'react';
import type {
    UseCoinmarketExchangeDetailProps,
    ContextValues,
} from 'src/types/wallet/coinmarketExchangeDetail';
import { useWatchExchangeTrade } from 'src/hooks/wallet/useCoinmarket';
import { useSelector } from 'src/hooks/suite';
import type { TradeExchange } from 'src/types/wallet/coinmarketCommonTypes';
import invityAPI from 'src/services/suite/invityAPI';

export const useCoinmarketExchangeDetail = ({
    selectedAccount,
}: UseCoinmarketExchangeDetailProps) => {
    const { account } = selectedAccount;
    const { invityServerEnvironment, trades, transactionId } = useSelector(state => ({
        invityServerEnvironment: state.suite.settings.debug.invityServerEnvironment,
        trades: state.wallet.coinmarket.trades,
        transactionId: state.wallet.coinmarket.exchange.transactionId,
    }));
    const exchangeTrade = trades.find(
        trade => trade.tradeType === 'exchange' && trade.key === transactionId,
    ) as TradeExchange;
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
