import { StringMap } from './service';

export type BuyTradeStatus =
    | 'LOGIN_REQUEST' // request to login to the partner's site
    | 'REQUESTING' // sending request to the partner
    | 'SUBMITTED' // request was submitted to the partner
    | 'APPROVAL_PENDING' // pending approval
    | 'SUCCESS' // receive tx was created, waiting for receive tx to be mined
    | 'BLOCKED' // the transaction was blocked, the customer will be contacted by email
    | 'ERROR'; // something went wrong during or after confirmTrade

export type BuyCryptoPaymentMethod =
    | 'bancontact'
    | 'eps'
    | 'bankTransfer'
    | 'creditCard'
    | 'giropay'
    | 'iDeal'
    | 'sofort';

export type BuyTradeTag =
    | 'renewed'
    | 'alternativeCurrency'
    | 'bestRate'
    | 'favorite'
    | 'wantCrypto';

export interface BuyProviderInfo {
    name: string; // simplex
    companyName: string; // Simplex
    logo: string; // simplex-icon.jpg
    isActive: boolean;
    tradedCoins: string[]; // ['BTC', 'BCH', 'LTC', 'XRP', 'ETH']
    tradedFiatCurrencies: string[]; // ['EUR', 'USD']
    supportedCountries: string[]; // ['AT', 'BE']
    paymentMethods: BuyCryptoPaymentMethod[];
    statusUrl: string; // https://payment-status.simplex.com/api/v1/user/payments?uuid={{paymentId}}
    supportUrl: string; // https://www.simplex.com/support/
}

export interface BuyListResponse {
    country: string;
    suggestedFiatCurrency?: string; // optional field, fiat currency based on user's IP
    providers: BuyProviderInfo[];
}

export interface BuyTradeQuoteRequest {
    wantCrypto: boolean; // true for cryptoAmount, false for fiatAmount
    fiatStringAmount?: string; // 1000 - will pay fiat amount
    cryptoStringAmount?: string; // 0.3 - requested amount in crypto currency
    fiatCurrency: string; // USD
    receiveCurrency: string; // BTC
    country?: string;
    paymentMethod?: BuyCryptoPaymentMethod;
}

export type BuyTradeQuoteResponse = BuyTrade[];

export interface BuyTrade {
    fiatStringAmount?: string; // 1000
    fiatCurrency?: string; // EUR
    receiveCurrency?: string; // BTC
    receiveStringAmount?: string; // 0.12345
    receiveAddress?: string; // users address for receive tx
    rate?: number; // 100
    quoteId?: string; // ID of the quote assigned by exchange
    orderId?: string; // ID of the order assigned by us
    originalPaymentId?: string; // ID of the payment assigned by us and later changed by the partner
    paymentId?: string; // ID of the payment assigned by us or by partner
    status?: BuyTradeStatus; // state of trade after confirmTrade
    error?: string; // something went wrong after confirmTrade
    receiveTxHash?: string; // hash of tx from exchange to user
    exchange?: string; // which exchange this trade belongs to, used for discrimination in ExchangeService
    validUntil?: string; // timestamp in ISO format of offer validity
    cid?: string; // google clientID
    minFiat?: number;
    maxFiat?: number;
    minCrypto?: number;
    maxCrypto?: number;
    paymentMethod?: BuyCryptoPaymentMethod;
    infoNote?: string;
    partnerData?: string; // arbitrary data specific for the partner
    tags?: BuyTradeTag[];
    // locally used data types
    tradeForm?: BuyTradeFormResponse;
}

export interface BuyTradeRequest {
    trade: BuyTrade;
    returnUrl: string;
}

export interface BuyTradeResponse {
    trade: BuyTrade;
    tradeForm?: BuyTradeFormResponse;
    requestTradeErrorType?: 'QUOTE_TIMEOUT' | 'UNKNOWN';
    newQuote?: BuyTrade;
}

export interface BuyTradeFormResponse {
    form?: {
        formMethod: 'GET' | 'POST' | 'IFRAME';
        formAction: string;
        fields: StringMap;
    };
    error?: string;
}

export interface WatchBuyTradeResponse {
    status?: BuyTradeStatus; // state of trade after confirmTrade
    error?: string; // something went wrong after confirmTrade
}
