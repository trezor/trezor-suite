import { Account } from '@wallet-types';
import { BuyTrade, ExchangeTrade, SellVoucherTrade as SpendTrade } from 'invity-api';

type CommonTrade = {
    date: string;
    key?: string;
    account: {
        descriptor: Account['descriptor'];
        symbol: Account['symbol'];
        accountType: Account['accountType'];
        accountIndex: Account['index'];
    };
};
export type TradeType = 'buy' | 'exchange' | 'spend';
export type TradeBuy = CommonTrade & { tradeType: 'buy'; data: BuyTrade };
export type TradeExchange = CommonTrade & { tradeType: 'exchange'; data: ExchangeTrade };
export type TradeSpend = CommonTrade & { tradeType: 'spend'; data: SpendTrade };
export type Trade = TradeBuy | TradeExchange | TradeSpend;
