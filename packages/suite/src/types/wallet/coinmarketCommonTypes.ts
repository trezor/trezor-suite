import { Account } from '@wallet-types';
import { BuyTrade, SellFiatTrade, ExchangeTrade, SellVoucherTrade as SpendTrade } from 'invity-api';
import { FlagProps } from '@trezor/components';

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
export type TradeType = 'buy' | 'sell' | 'exchange' | 'spend';
export type TradeBuy = CommonTrade & { tradeType: 'buy'; data: BuyTrade };
export type TradeSell = CommonTrade & { tradeType: 'sell'; data: SellFiatTrade };
export type TradeExchange = CommonTrade & { tradeType: 'exchange'; data: ExchangeTrade };
export type TradeSpend = CommonTrade & { tradeType: 'spend'; data: SpendTrade };
export type Trade = TradeBuy | TradeSell | TradeExchange | TradeSpend;

export type Option = { value: string; label: string };
export type CountryOption = { value: FlagProps['country']; label: string };
export type DefaultCountryOption = { value: string; label?: string };
