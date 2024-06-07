import { createContext, useContext } from 'react';
import { CoinmarketTradeType } from 'src/types/coinmarket/coinmarket';
import { CoinmarketFormContextValues } from 'src/types/coinmarket/coinmarketForm';

export const CoinmarketFormContext = createContext<CoinmarketFormContextValues<any> | null>(null);
CoinmarketFormContext.displayName = 'CoinmarketFormContext';

export const useCoinmarketFormContext = <T extends CoinmarketTradeType>() => {
    const context = useContext<CoinmarketFormContextValues<T> | null>(CoinmarketFormContext);
    if (context === null) throw Error('CoinmarketFormContext used without Context');

    return context;
};
