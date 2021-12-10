import {
    BuyCryptoPaymentMethod,
    BuyTrade,
    ExchangeTrade,
    SellCryptoPaymentMethod,
    SellFiatTrade,
} from 'invity-api';

export type InvityServerEnvironment = 'production' | 'staging1' | 'staging2' | 'localhost';
export type InvityServerType = 'api' | 'authentication';

export type InvityServer = {
    [key in InvityServerType]: string;
};

export type InvityServers = {
    [key in InvityServerEnvironment]: InvityServer;
};

export interface TradeMetadata {
    createdAt: string; // timestamp in ISO format of trade creation
    finalizedAt?: string; // timestamp in ISO format of trade reaching a final state
    amountInAccountFiat?: number; // amount of transaction in user's selected fiat currency
    amountInAccountCrypto?: number; // amount of transaction in user's selected fiat currency
}

export interface AccountSettings {
    country: string;
    language: string;
    fiatCurrency: string;
    cryptoCurrency: string;
    paymentMethods?: (BuyCryptoPaymentMethod | SellCryptoPaymentMethod)[];
    newsletter1Mails?: boolean;
    newsletter2Mails?: boolean;
    transactionMails?: boolean;
}

export interface Session {
    createdAt: string; // timestamp in ISO format of trade creation
    browser: string;
    location: string;
}

export type AccountBuyTrade = BuyTrade & TradeMetadata;
export type AccountSellTrade = SellFiatTrade & TradeMetadata;
export type AccountExchangeTrade = ExchangeTrade & TradeMetadata;

// TODO: Do we need buyTrades/sellTrades/exchangeTrades here?
export interface AccountInfo {
    id: string;
    settings: AccountSettings;
    sessions: Session[];
    buyTrades: AccountBuyTrade[];
    sellTrades: AccountSellTrade[];
    exchangeTrades: AccountExchangeTrade[];
}

export interface AccountInfoResponse {
    data?: AccountInfo;
    error?: string;
}
