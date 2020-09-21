import { createContext, useContext } from 'react';
import { Props, ContextValues } from '@wallet-types/coinmarketBuyDetail';
import { useWatchBuyTrade } from '@wallet-hooks/useCoinmarket';

export const useCoinmarketBuyDetail = (props: Props) => {
    const { selectedAccount, trades, transactionId } = props;
    const { account } = selectedAccount;
    const [updatedTrade] = useWatchBuyTrade(account, trades, transactionId);

    return {
        account,
        trade: updatedTrade,
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
