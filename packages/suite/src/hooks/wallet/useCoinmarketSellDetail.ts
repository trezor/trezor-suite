import { createContext, useContext } from 'react';
import { Props, ContextValues } from '@wallet-types/coinmarketSellDetail';
import { useWatchSellTrade } from '@wallet-hooks/useCoinmarket';
import { useSelector } from '@suite-hooks';
import { TradeSell } from '@wallet-types/coinmarketCommonTypes';
import invityAPI from '@suite-services/invityAPI';

export const useCoinmarketSellDetail = (props: Props) => {
    const { selectedAccount, trades, transactionId } = props;
    const sellTrade = trades.find(
        trade => trade.tradeType === 'sell' && trade.key === transactionId,
    ) as TradeSell;
    const { account } = selectedAccount;
    const invityServerEnvironment = useSelector(
        state => state.suite.settings.debug.invityServerEnvironment,
    );
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
