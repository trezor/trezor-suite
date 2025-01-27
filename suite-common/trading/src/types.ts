import type {
    BuyCryptoPaymentMethod,
    BuyTrade,
    ExchangeTrade,
    SellCryptoPaymentMethod,
    SellFiatTrade,
    WatchBuyTradeResponse,
    WatchExchangeTradeResponse,
    WatchSellTradeResponse,
} from 'invity-api';

export type InvityServerEnvironment = 'production' | 'staging' | 'dev' | 'localhost';
export type InvityServers = Record<InvityServerEnvironment, string>;

export type TradingBuyType = 'buy';
export type TradingSellType = 'sell';
export type TradingExchangeType = 'exchange';
export type TradingType = TradingBuyType | TradingSellType | TradingExchangeType;

// information about created trade
export type TradingTradeType = BuyTrade | SellFiatTrade | ExchangeTrade;

export type TradingWatchTradeResponsePropsMap = {
    buy: WatchBuyTradeResponse;
    sell: WatchSellTradeResponse;
    exchange: WatchExchangeTradeResponse;
};

export type TradingPaymentMethodType = BuyCryptoPaymentMethod | SellCryptoPaymentMethod;
