import { createContext, useContext } from 'react';

import type { TradingType } from '@suite-common/invity';

import { CoinmarketFormContextValues } from 'src/types/coinmarket/coinmarketForm';

export const CoinmarketFormContext = createContext<CoinmarketFormContextValues<TradingType> | null>(
    null,
);
CoinmarketFormContext.displayName = 'CoinmarketFormContext';

export const useCoinmarketFormContext = <T extends TradingType>() => {
    const context = useContext(CoinmarketFormContext);
    if (context === null) throw Error('CoinmarketFormContext used without Context');

    return context as CoinmarketFormContextValues<T>;
};
