import { type PropsWithChildren, createContext, useContext } from 'react';

import { type TradingExchangeFormContextProps } from 'src/types/trading/tradingForm';

export const TradingExchangeFormContext = createContext<TradingExchangeFormContextProps | null>(
    null,
);
TradingExchangeFormContext.displayName = 'TradingExchangeFormContext';

type TradingExchangeContextProviderProps = {
    value: TradingExchangeFormContextProps;
} & PropsWithChildren;

export const TradingExchangeContextProvider = ({
    value,
    children,
}: TradingExchangeContextProviderProps) => (
    <TradingExchangeFormContext.Provider value={value}>
        {children}
    </TradingExchangeFormContext.Provider>
);

export const useTradingExchangeFormContext = () => {
    const context = useContext(TradingExchangeFormContext);
    if (context === null) throw Error('TradingExchangeFormContext used without Context');

    return context;
};
