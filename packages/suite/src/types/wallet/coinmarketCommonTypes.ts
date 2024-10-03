import type { Account } from 'src/types/wallet';
import type { BuyTrade, SellFiatTrade, ExchangeTrade, FiatCurrencyCode } from 'invity-api';
import type { FlagProps } from '@trezor/components';

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
export type TradeType = 'buy' | 'sell' | 'exchange';
export type TradeBuy = CommonTrade & { tradeType: 'buy'; data: BuyTrade };
export type TradeSell = CommonTrade & { tradeType: 'sell'; data: SellFiatTrade };
export type TradeExchange = CommonTrade & { tradeType: 'exchange'; data: ExchangeTrade };
export type Trade = TradeBuy | TradeSell | TradeExchange;

export type Option = { value: string; label: string };
export type CountryOption = { value: FlagProps['country']; label: string };
export type DefaultCountryOption = { value: string; label: string };
export type FiatCurrencyOption = {
    value: FiatCurrencyCode;
    label: string;
};

export interface CryptoAmountLimits {
    currency: string;
    minCrypto?: number;
    maxCrypto?: number;
}

export interface AmountLimits extends CryptoAmountLimits {
    minFiat?: number;
    maxFiat?: number;
}
