import type {
    BuyCryptoPaymentMethod,
    BuyTrade,
    BuyTradeStatus,
    CryptoId,
    ExchangeTrade,
    ExchangeTradeStatus,
    FiatCurrencyCode,
    SellCryptoPaymentMethod,
    SellFiatTrade,
    SellTradeStatus,
    WatchBuyTradeResponse,
    WatchExchangeTradeResponse,
    WatchSellTradeResponse,
} from 'invity-api';

import { AccountType } from '@suite-common/wallet-config';
import type { Account } from '@suite-common/wallet-types';

export type InvityServerEnvironment = 'production' | 'staging' | 'dev' | 'localhost';
export type InvityServers = Record<InvityServerEnvironment, string>;

export type TradingBuyType = 'buy';
export type TradingSellType = 'sell';
export type TradingExchangeType = 'exchange';
export type TradingType = TradingBuyType | TradingSellType | TradingExchangeType;

export type TradingTradeBuySellType = Exclude<TradingType, TradingExchangeType>;

// information about created trade
export type TradingTradeType = BuyTrade | SellFiatTrade | ExchangeTrade;
export type TradingTradeMapProps = {
    buy: BuyTrade;
    sell: SellFiatTrade;
    exchange: ExchangeTrade;
};
export type TradingTradeBuySellMapProps = Omit<TradingTradeMapProps, 'exchange'>;

export type TradingWatchTradeResponsePropsMap = {
    buy: WatchBuyTradeResponse;
    sell: WatchSellTradeResponse;
    exchange: WatchExchangeTradeResponse;
};

export type TradingPaymentMethodType = BuyCryptoPaymentMethod | SellCryptoPaymentMethod;
export type TradingTradeStatusType = BuyTradeStatus | SellTradeStatus | ExchangeTradeStatus;
export type TradingUtilsProvidersProps = {
    [name: string]: {
        logo: string;
        companyName: string;
        brandName?: string;
    };
};

export type TradingParsedCryptoIdProps = {
    networkId: CryptoId;
    contractAddress: string | undefined;
};

export type TradingFiatCurrenciesProps = Map<FiatCurrencyCode, string>;
export type TradingPaymentMethodProps = BuyCryptoPaymentMethod | '';
export type TradingPaymentMethodListProps = {
    value: TradingPaymentMethodProps;
    label: string;
};

type TradingCommonTransaction = {
    date: string;
    key?: string;
    account: {
        descriptor: Account['descriptor'];
        symbol: Account['symbol'];
        accountType: Account['accountType'];
        accountIndex: Account['index'];
    };
};
export type TradingTransactionBuy = TradingCommonTransaction & { tradeType: 'buy'; data: BuyTrade };
export type TradingTransactionSell = TradingCommonTransaction & {
    tradeType: 'sell';
    data: SellFiatTrade;
};
export type TradingTransactionExchange = TradingCommonTransaction & {
    tradeType: 'exchange';
    data: ExchangeTrade;
};
export type TradingTransaction =
    | TradingTransactionBuy
    | TradingTransactionSell
    | TradingTransactionExchange;

export interface TradingAccountOptionsGroupOptionProps {
    value: CryptoId;
    label: string; // token shortcut
    cryptoName: string | undefined; // full name
    balance: string;
    descriptor: string;
    decimals: number;
    contractAddress?: string;
    accountType?: AccountType;
}

export type TradingOTC = {
    idWidget: string;
    idOtcUser: string;
    apiUrl: string;
    minimumFiat: string;
    allowedCurrencies: FiatCurrencyCode[];
};
