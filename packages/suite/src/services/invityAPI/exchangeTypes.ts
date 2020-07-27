import { StringMap } from './service';

export type ExchangeTradeStatus =
    | 'LOADING' // fetching address from exchange
    | 'CONFIRM' // waiting for user confirmation on TREZOR
    | 'SENDING' // send tx was created, waiting for send tx to be sent
    | 'CONFIRMING' // send tx was sent, waiting for tx to be mined (not used for Trezor Wallet)
    | 'CONVERTING' // send tx was mined, money is on exchange, receive tx not yet created
    | 'SUCCESS' // receive tx was created, waiting for receive tx to be mined
    | 'ERROR' // something went wrong during or after confirmTrade
    | 'KYC'; // Trade is subject to KYC/AML

type ExchangeFee =
    | number // actual fee amount in 'receive' currency
    | 'INCLUDED' // exchange won't tell, but receiveAmount and rate already include it
    | 'UNKNOWN'; // exchange won't tell, receiveAmount and rate don't include it

type ExchangeMaximum =
    | number // actual maximum amount in 'send' currency
    | 'NONE'; // exchange does not have a maximum trade size

export interface ExchangeProviderInfo {
    name: string; // changenow
    companyName: string; // ChangeNow
    logo: string; // changenow-icon.jpg
    isActive: boolean;
    isFixedRate: boolean;
    buyTickers: string[];
    sellTickers: string[];
    addressFormats: StringMap; // specification of formats required by selected exchange
    statusUrl: string; // https://changenow.io/exchange/txs/{{orderId}}
    kycUrl: string; // https://changenow.io/faq#kyc
    supportUrl: string; // https://support.changenow.io
    // TODO region of operation
    kycPolicy?: string;
    isRefundRequired?: boolean;
}

export type ExchangeListResponse = ExchangeProviderInfo[];

export interface ExchangeCoinInfo {
    ticker: string; // BTC
    name: string; // Bitcoin
    category: string; // popular
}

export type ExchangeCoinListResponse = ExchangeCoinInfo[];

export interface ExchangeTrade {
    send?: string; // BTC
    sendStringAmount?: string; // 0.01
    sendAddress?: string; // exchange address for send tx
    receive?: string; // LTC
    receiveStringAmount?: string; // 1
    receiveAddress?: string; // users address for receive tx
    rate?: number; // 100
    min?: number; // 0.001
    max?: ExchangeMaximum;
    fee?: ExchangeFee;
    partnerPaymentExtraId?: string; // Extra ID for payments to exchange for networks that require it
    signature?: string; // Evercoin only, passed from createTrade response to confirmTrade request
    orderId?: string; // internal ID assigned to the trade by the exchange
    statusUrl?: string; // internal URL + ID assigned to the trade by the exchange to check status
    status?: ExchangeTradeStatus; // state of trade after confirmTrade
    error?: string; // something went wrong after confirmTrade
    receiveTxHash?: string; // hash of tx from exchange to user
    cid?: string; // google clientID
    offerReferenceId?: string; // coinswitch only
    rateIdentificator?: string; // rate identificator for fixed rate exchanges
    exchange?: string; // which exchange this trade belongs to, used for discrimination in ExchangeService
    quoteToken?: string; // fox.exchange only
    extraField?: string; // payments to user wallet extra field (payout)
    extraFieldDescription?: CoinExtraField;
    // locally used fields
    offerType?: 'bestRate' | 'favorite';
}

export interface CoinExtraField {
    name: string;
    description: string;
    required: boolean;
    type: 'number' | 'text' | 'hex';
}

export interface ExchangeTradeQuoteRequest {
    send: string; // BTC
    receive: string; // LTC
    sendStringAmount: string; // 0.01
}

export type ExchangeTradeQuoteResponse = ExchangeTrade[];

export interface ConfirmExchangeTradeRequest {
    trade: ExchangeTrade;
    receiveAddress: string; // address hash
    refundAddress: string; // address hash (optional because Changelly doesn't support it)
    extraField?: string; // XRP destination tag, XMR label id, ...
}

export interface WatchExchangeTradeResponse {
    status?: ExchangeTradeStatus; // state of trade after confirmTrade
    receiveTxHash?: string;
    rate?: number;
    receiveStringAmount?: string;
    error?: string; // something went wrong after confirmTrade
}
