import { createContext, useContext } from 'react';

import type { TradingType } from '@suite-common/trading';

import { TradingFormContextValues } from 'src/types/trading/tradingForm';

export const TradingFormContext = createContext<TradingFormContextValues<TradingType> | null>(null);
TradingFormContext.displayName = 'TradingFormContext';

export const useTradingFormContext = <T extends TradingType>() => {
    const context = useContext(TradingFormContext);
    if (context === null) throw Error('TradingFormContext used without Context');

    return context as TradingFormContextValues<T>;
};
