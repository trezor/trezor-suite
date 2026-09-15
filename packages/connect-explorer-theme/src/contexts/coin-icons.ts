import { createContext, useContext } from 'react';

export type CoinIcons = Record<string, string>;

const CoinIconsContext = createContext<CoinIcons>({});

export const CoinIconsProvider = CoinIconsContext.Provider;

export const useCoinIcons = () => useContext(CoinIconsContext);
