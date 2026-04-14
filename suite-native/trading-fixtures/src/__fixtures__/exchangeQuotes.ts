import type { CryptoId, ExchangeTrade } from 'invity-api';

export const mercuryoFixedWorstQuote: ExchangeTrade = {
    exchange: 'mercuryo',
    fee: 'UNKNOWN',
    max: 'NONE',
    min: 0,
    orderId: 'c2de24a5-b923-42af-b70e-44bda8fa41dd',
    quoteId: 'mercuryo-fixed-worst',
    rate: 0.0000083554,
    rateIdentificator: 'bf33ed7b-1613-43c6-8603-c3586f0c6f76:0',
    receive: 'bitcoin' as CryptoId,
    receiveStringAmount: '0.00083554',
    send: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CryptoId,
    sendStringAmount: '100',
    swapGasEstimate: 692081943.384627,
    swapSlippage: '1',
};

export const mercuryoFixedBestQuote: ExchangeTrade = {
    exchange: 'mercuryo',
    fee: 'UNKNOWN',
    max: 11198149.828535,
    min: 36.007531199999995,
    orderId: 'cbf6ed34-372c-4513-bfb9-1edfeebc4579',
    quoteId: 'mercuryo-fixed-best',
    rate: 0.000009133,
    receive: 'bitcoin' as CryptoId,
    receiveStringAmount: '0.00089537',
    send: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CryptoId,
    sendStringAmount: '100',
};

export const cexdirectFloatingQuote: ExchangeTrade = {
    exchange: 'cexdirect',
    fee: 'INCLUDED',
    max: 400083.679219,
    min: 60.012552,
    orderId: '8e7450f4-8c9d-4694-b8fa-2263c1701f93',
    quoteId: 'cexdirect-floating',
    rate: 0.0000090911,
    rateIdentificator: 'ocrWdSoKs8VAQwctkiI~)7qRERjvlm',
    receive: 'bitcoin' as CryptoId,
    receiveStringAmount: '0.00089118',
    send: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CryptoId,
    sendStringAmount: '100',
};

export const invityDexQuote: ExchangeTrade = {
    exchange: 'invity',
    fee: 'UNKNOWN',
    isDex: true,
    max: 100020.004001,
    min: 28.229646,
    orderId: '902bec47-3d5e-45db-8cf9-71e40515785f',
    quoteId: 'invity-dex',
    rate: 0.000008989855,
    receive: 'bitcoin' as CryptoId,
    receiveStringAmount: '0.00088076',
    send: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CryptoId,
    sendStringAmount: '100',
};

export const mercuryoDexQuote: ExchangeTrade = {
    exchange: 'mercuryo',
    fee: 'UNKNOWN',
    max: 'NONE',
    isDex: true,
    min: 0,
    orderId: 'c2de24a5-b923-42af-b70e-44bda8fa41dc',
    quoteId: 'mercuryo-dex',
    rate: 0.0000083554,
    rateIdentificator: 'bf33ed7b-1613-43c6-8603-c3586f0c6f76:0',
    receive: 'bitcoin' as CryptoId,
    receiveStringAmount: '0.00083554',
    send: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CryptoId,
    sendStringAmount: '100',
    swapGasEstimate: 692081943.384627,
    swapSlippage: '1',
};

export const oneInchFusionPlusQuote: ExchangeTrade = {
    exchange: '1inchfusionplus',
    fee: 'UNKNOWN',
    max: 'NONE',
    isDex: true,
    min: 0,
    orderId: 'd3ef25b6-c934-43bf-c81f-55ceb9gb52ed',
    quoteId: '1inch-fusion-plus',
    rate: 0.0000081234,
    rateIdentificator: 'cf44fe8c-2724-54d7-9704-d4697g1d7g87:0',
    receive: 'bitcoin' as CryptoId,
    receiveStringAmount: '0.00081234',
    send: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CryptoId,
    sendStringAmount: '100',
    swapGasEstimate: 0,
    swapSlippage: '1',
};

export const exchangeQuotes = [
    mercuryoFixedWorstQuote,
    mercuryoFixedBestQuote,
    cexdirectFloatingQuote,
    invityDexQuote,
    mercuryoDexQuote,
    oneInchFusionPlusQuote,
];
