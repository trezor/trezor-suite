import { createContext, useContext } from 'react';
import type {
    UseCoinmarketSellDetailProps,
    ContextValues,
} from 'src/types/wallet/coinmarketSellDetail';
import { useWatchSellTrade } from 'src/hooks/wallet/useCoinmarket';
import { useSelector } from 'src/hooks/suite';
import type { TradeSell } from 'src/types/wallet/coinmarketCommonTypes';
import invityAPI from 'src/services/suite/invityAPI';

export const useCoinmarketSellDetail = ({ selectedAccount }: UseCoinmarketSellDetailProps) => {
    const { account } = selectedAccount;
    const { invityServerEnvironment, trades, transactionId } = useSelector(state => ({
        invityServerEnvironment: state.suite.settings.debug.invityServerEnvironment,
        trades: state.wallet.coinmarket.trades,
        transactionId: state.wallet.coinmarket.sell.transactionId,
    }));
    const sellTrade = trades.find(
        trade => trade.tradeType === 'sell' && trade.key === transactionId,
    ) as TradeSell;
    if (invityServerEnvironment) {
        invityAPI.setInvityServersEnvironment(invityServerEnvironment);
    }
    const sellInfo = useSelector(state => state.wallet.coinmarket.sell.sellInfo);
    useWatchSellTrade(account, sellTrade);

    return {
        account,
        trade: sellTrade,
        transactionId,
        sellInfo,
    };
};

export const CoinmarketSellDetailContext = createContext<ContextValues | null>(null);
CoinmarketSellDetailContext.displayName = 'CoinmarketSellDetailContext';

export const useCoinmarketSellDetailContext = () => {
    const context = useContext(CoinmarketSellDetailContext);
    if (context === null) throw Error('CoinmarketSellDetailContext used without Context');
    return context;
};
