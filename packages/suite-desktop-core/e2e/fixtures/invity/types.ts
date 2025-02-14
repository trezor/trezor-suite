type Trade = {
    receiveAddress: string;
    paymentId: string;
    status: string;
    originalPaymentId: string;
    partnerData: string;
    exchange: string;
    fiatCurrency: string;
    receiveCurrency: string;
    rate: number;
    wantCrypto: boolean;
    exp: string;
    country: string;
    paymentMethodName: string;
    tags?: string[];
    fiatStringAmount: string;
    receiveStringAmount: string;
    minFiat: number;
    maxFiat: number;
    minCrypto: number;
    maxCrypto: number;
    paymentMethod: string;
    quoteId: string;
    orderId: string;
    partnerData2?: string;
};

type SellTrade = {
    refundAddress: string;
    paymentId: string;
    status: string;
    partnerData: string;
    exchange: string;
    fiatCurrency: string;
    cryptoCurrency: string;
    rate: number;
    amountInCrypto: boolean;
    exp: string;
    country: string;
    paymentMethodName: string;
    fiatStringAmount: string;
    cryptoStringAmount: string;
    minFiat: number;
    maxFiat: number;
    minCrypto: number;
    maxCrypto: number;
    paymentMethod: string;
    orderId: string;
    validUntil?: string;
};

type TradeForm = {
    form: {
        formMethod: string;
        formAction: string;
        fields: Record<string, unknown>;
    };
};

export type TradeResponse = {
    trade: Trade;
    tradeForm: TradeForm;
};

export type SellTradeResponse = {
    trade: SellTrade;
    tradeForm: TradeForm;
};
