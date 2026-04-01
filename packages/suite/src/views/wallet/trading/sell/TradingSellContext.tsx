import { type PropsWithChildren, createContext, useContext } from 'react';

import { type TradingSellFormContextProps } from 'src/types/trading/tradingForm';

export const TradingSellFormContext = createContext<TradingSellFormContextProps | null>(null);
TradingSellFormContext.displayName = 'TradingSellFormContext';

type TradingSellContextProviderProps = {
    value: TradingSellFormContextProps;
} & PropsWithChildren;

export const TradingSellContextProvider = ({
    value,
    children,
}: TradingSellContextProviderProps) => (
    <TradingSellFormContext.Provider value={value}>{children}</TradingSellFormContext.Provider>
);

export const useTradingSellFormContext = () => {
    const context = useContext(TradingSellFormContext);
    if (context === null) throw Error('TradingSellFormContext used without Context');

    return context;
};
