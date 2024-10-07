import { createContext, useContext } from 'react';
import {
    CoinmarketTradeBuyType,
    CoinmarketTradeExchangeType,
    CoinmarketTradeSellType,
    CoinmarketTradeType,
} from 'src/types/coinmarket/coinmarket';
import {
    CoinmarketOffersContextValues,
    CoinmarketOffersMapProps,
} from 'src/types/coinmarket/coinmarketOffers';

export const isCoinmarketBuyOffers = (
    offersContext: CoinmarketOffersMapProps[keyof CoinmarketOffersMapProps],
): offersContext is CoinmarketOffersMapProps[CoinmarketTradeBuyType] =>
    offersContext.type === 'buy';

export const isCoinmarketSellOffers = (
    offersContext: CoinmarketOffersMapProps[keyof CoinmarketOffersMapProps],
): offersContext is CoinmarketOffersMapProps[CoinmarketTradeSellType] =>
    offersContext.type === 'sell';

export const isCoinmarketExchangeOffers = (
    offersContext: CoinmarketOffersMapProps[keyof CoinmarketOffersMapProps],
): offersContext is CoinmarketOffersMapProps[CoinmarketTradeExchangeType] =>
    offersContext.type === 'exchange';

export const CoinmarketOffersContext =
    createContext<CoinmarketOffersContextValues<CoinmarketTradeType> | null>(null);

CoinmarketOffersContext.displayName = 'CoinmarketOffersContext';

export const useCoinmarketOffersContext = <T extends CoinmarketTradeType>() => {
    const context = useContext(CoinmarketOffersContext);
    if (context === null) throw Error('CoinmarketOffersContext used without Context');

    return context as CoinmarketOffersContextValues<T>;
};
