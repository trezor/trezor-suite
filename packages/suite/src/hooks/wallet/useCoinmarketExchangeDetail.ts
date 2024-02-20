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
    const invityServerEnvironment = useSelector(
        state => state.suite.settings.debug.invityServerEnvironment,
    );
    const trades = useSelector(state => state.wallet.coinmarket.trades);
    const transactionId = useSelector(state => state.wallet.coinmarket.exchange.transactionId);

    const { account } = selectedAccount;

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
