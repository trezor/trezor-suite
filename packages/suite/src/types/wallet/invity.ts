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
    phoneNumber?: string;
    phoneNumberVerified?: string;
    givenName?: string;
    familyName?: string;
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

export interface AccountUpdateResponse {
    statusCode: number;
    error?: string;
}

export interface InvityAuthentication {
    // properties from kratos
    id?: string;
    active?: boolean;
    identity?: {
        id: string;
        traits: { [key: string]: string };
        // eslint-disable-next-line camelcase
        verifiable_addresses: Array<Record<string, any>>;
    };
    error?: {
        code: number;
        status: string;
        reason: string;
    };
    // properties from API server or calculated
    verified?: boolean;
    email?: string;
    accountInfo?: AccountInfo;
}
