import {
    BuyTrade,
    BuyTradeStatus,
    CryptoId,
    ExchangeTradeStatus,
    SellTradeStatus,
} from 'invity-api';

import {
    TradingTransactionBuy,
    TradingTransactionExchange,
    TradingTransactionSell,
} from '@suite-common/trading';
import { AccountType, NetworkSymbol } from '@suite-common/wallet-config';

export const getBuyTrade = ({
    status,
}: {
    status: BuyTradeStatus | undefined;
}): TradingTransactionBuy => ({
    account: {
        accountIndex: 0,
        accountType: 'normal',
        descriptor: 'eth1-normal',
        symbol: 'eth',
    },
    data: {
        country: 'CZ',
        exchange: 'mercuryo',
        exp: 'RY4MuwYn8R8xEws+14DFjw==',
        fiatCurrency: 'USD',
        fiatStringAmount: '1234',
        maxCrypto: 143.168587,
        maxFiat: 380341.52,
        minCrypto: 0.143144,
        minFiat: 380.35,
        orderId: 'd3ef3451-8f68-4250-9e08-580ece5e7d12',
        originalPaymentId: 'b907a5347-db51-4a2d-806d-3b4869f5cd44',
        partnerData:
            'https://exchange.mercuryo.io/?widget_id=865f3f01-ab22-447c-990c-dc37232ee643&type=buy&fix_amount=true&currency=SOL&network=SOLANA&fix_currency=true&fix_fiat_amount=true&fiat_currency=CZK&fix_fiat_currency=true&address=Ee11dZkVEMN7u3E7xabReNp45RNgHJZAGqreVAhngh9t&hide_address=false&country_code=CZ&merchant_transaction_id=1146b3a9-ba27-4c9c-b3ae-45524fe63a97&theme=invity&return_url=trezorsuitelite%3A%2F%2Fbuy%2Ftrade%3Freceive%3Dsolana%26send%3DCZK%26fiatAmount%3Dundefined&utm_source=Trezor&utm_referral=referral&payment_method=card&signature=1ef703a2175a7d1a3ab255aabb753c8a54146c7c19453dc6ebc1f667fb0045755a03d4df979c3c68a37af5cb9f5e73b88eec390a49fd31311019a2a7a65c6cfb&fiat_amount=1234',
        paymentId: '7546b3a9-ba27-4c9c-b3ae-45524fe63a97',
        paymentMethod: 'creditCard',
        paymentMethodName: 'Credit Card',
        quoteId: '91f73c9d-7003-4e4e-b120-3dc679816bc0',
        rate: 2541.21,
        receiveAddress: 'A1bZdZkVEMN7u3E7xabReNp45RNgHJZAGqreVAhngh9t',
        receiveCurrency: 'ethereum' as CryptoId,
        receiveStringAmount: '0.462586',
        status,
        wantCrypto: false,
    } as BuyTrade,
    date: '2025-04-10T20:21:25.042Z',
    key: '7546b3a9-ba27-4c9c-b3ae-45524fe63a97',
    tradeType: 'buy',
    receiveAccountKey: 'eth1',
});

export const getExchangeTrade = ({
    status,
}: {
    status: ExchangeTradeStatus | undefined;
}): TradingTransactionExchange => ({
    tradeType: 'exchange' as const,
    date: '2025-02-12T20:11:03.042Z',
    key: 'exchange-key',
    account: {
        symbol: 'sol' as NetworkSymbol,
        descriptor: 'sol1-normal',
        accountIndex: 0,
        accountType: 'normal' as AccountType,
    },
    data: {
        status,
        orderId: '12ffba9e-7370-4a6e-87dc-aefd3851c735',
        sendAddress: 'address',
        partnerPaymentExtraId: 'extraId',
        send: 'solana--jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL' as CryptoId,
        sendStringAmount: '10.1232',
        receive: 'solana' as CryptoId,
        receiveStringAmount: '0.462586',
        exchange: 'mercuryo',
    },
    sendAccountKey: 'sol1',
    receiveAccountKey: 'sol1',
});

export const getSellTrade = ({
    status,
}: {
    status: SellTradeStatus | undefined;
}): TradingTransactionSell => ({
    tradeType: 'sell',
    date: '2025-01-01T20:12:25.042Z',
    key: 'sell-key',
    account: {
        symbol: 'btc',
        descriptor: 'btc1-normal',
        accountIndex: 0,
        accountType: 'normal',
    },
    data: {
        cryptoStringAmount: '1.22',
        fiatStringAmount: '100',
        fiatCurrency: 'USD',
        cryptoCurrency: 'bitcoin' as CryptoId,
        orderId: 'd369ba9e-7370-4a6e-87dc-aefd3851c735',
        exchange: 'mercuryo',
        status,
        partnerData:
            'https://exchange.mercuryo.io/?widget_id=865f3f01-ab22-447c-990c-dc37232ee643&type=buy&fix_amount=true&currency=SOL&network=SOLANA&fix_currency=true&fix_fiat_amount=true&fiat_currency=CZK&fix_fiat_currency=true&address=Ee11dZkVEMN7u3E7xabReNp45RNgHJZAGqreVAhngh9t&hide_address=false&country_code=CZ&merchant_transaction_id=1146b3a9-ba27-4c9c-b3ae-45524fe63a97&theme=invity&return_url=trezorsuitelite%3A%2F%2Fbuy%2Ftrade%3Freceive%3Dsolana%26send%3DCZK%26fiatAmount%3Dundefined&utm_source=Trezor&utm_referral=referral&payment_method=card&signature=1ef703a2175a7d1a3ab255aabb753c8a54146c7c19453dc6ebc1f667fb0045755a03d4df979c3c68a37af5cb9f5e73b88eec390a49fd31311019a2a7a65c6cfb&fiat_amount=1234',
    },
    sendAccountKey: 'btc1',
});
