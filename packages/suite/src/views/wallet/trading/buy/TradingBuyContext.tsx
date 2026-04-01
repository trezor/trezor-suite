import { type PropsWithChildren, createContext, useContext } from 'react';

import { type TradingBuyFormContextProps } from 'src/types/trading/tradingForm';

export const TradingBuyFormContext = createContext<TradingBuyFormContextProps | null>(null);
TradingBuyFormContext.displayName = 'TradingBuyFormContext';

type TradingBuyContextProviderProps = {
    value: TradingBuyFormContextProps;
} & PropsWithChildren;

export const TradingBuyContextProvider = ({ value, children }: TradingBuyContextProviderProps) => (
    <TradingBuyFormContext.Provider value={value}>{children}</TradingBuyFormContext.Provider>
);

export const useTradingBuyFormContext = () => {
    const context = useContext(TradingBuyFormContext);
    if (context === null) throw Error('TradingBuyFormContext used without Context');

    return context;
};
