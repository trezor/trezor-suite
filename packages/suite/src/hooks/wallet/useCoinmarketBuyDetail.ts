import { createContext, useContext } from 'react';
import { UseCoinmarketBuyDetailProps, ContextValues } from '@wallet-types/coinmarketBuyDetail';
import { useWatchBuyTrade } from '@wallet-hooks/useCoinmarket';
import { useSelector } from '@suite-hooks';
import invityAPI from '@suite-services/invityAPI';
import type { TradeBuy } from '@wallet-types/coinmarketCommonTypes';

export const useCoinmarketBuyDetail = ({ selectedAccount }: UseCoinmarketBuyDetailProps) => {
    const { account } = selectedAccount;
    const { invityServerEnvironment, buyInfo, trades, transactionId } = useSelector(state => ({
        invityServerEnvironment: state.suite.settings.debug.invityServerEnvironment,
        buyInfo: state.wallet.coinmarket.buy.buyInfo,
        trades: state.wallet.coinmarket.trades,
        transactionId: state.wallet.coinmarket.buy.transactionId,
    }));
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
