import { createContext, useContext } from 'react';
import { UseCoinmarketBuyDetailProps, ContextValues } from 'src/types/wallet/coinmarketBuyDetail';
import { useWatchBuyTrade } from 'src/hooks/wallet/useCoinmarket';
import { useSelector } from 'src/hooks/suite';
import invityAPI from 'src/services/suite/invityAPI';
import type { TradeBuy } from 'src/types/wallet/coinmarketCommonTypes';

export const useCoinmarketBuyDetail = ({ selectedAccount }: UseCoinmarketBuyDetailProps) => {
    const invityServerEnvironment = useSelector(
        state => state.suite.settings.debug.invityServerEnvironment,
    );
    const buyInfo = useSelector(state => state.wallet.coinmarket.buy.buyInfo);
    const trades = useSelector(state => state.wallet.coinmarket.trades);
    const transactionId = useSelector(state => state.wallet.coinmarket.buy.transactionId);

    const { account } = selectedAccount;

    const buyTrade = trades.find(
        trade =>
            trade.tradeType === 'buy' &&
            (trade.key === transactionId || trade.data?.originalPaymentId === transactionId),
    ) as TradeBuy;
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
