import type { Account } from '@suite-common/wallet-types';

import type {
    TradingBuyInfoSelector,
    TradingExchangeInfoSelector,
    TradingSellInfoSelector,
} from '../selectors/tradingSelectors';
import type {
    TradingTransactionBuy,
    TradingTransactionExchange,
    TradingTransactionSell,
    TradingType,
} from '../types';

export type TradingTradeTransactionMapProps = {
    buy: TradingTransactionBuy;
    sell: TradingTransactionSell;
    exchange: TradingTransactionExchange;
};

export type TradingTradeInfoMapProps = {
    buy: TradingBuyInfoSelector;
    sell: TradingSellInfoSelector;
    exchange: TradingExchangeInfoSelector;
};

export interface TradingGetDetailDataOutputProps<T extends TradingType> {
    transactionId?: string;
    info?: TradingTradeInfoMapProps[T] | undefined;
    trade?: TradingTradeTransactionMapProps[T] | undefined;
}

export interface TradingUseDetailProps {
    account: Account;
    tradeType: TradingType;
}

export type TradingUseDetailPropsWithoutAccount = Omit<TradingUseDetailProps, 'account'>;
export interface TradingUseDetailOutputProps<T extends TradingType> {
    transactionId: string | undefined;
    info: TradingTradeInfoMapProps[T] | undefined;
    trade: TradingTradeTransactionMapProps[T] | undefined;
    account: Account | undefined;
}

export type TradingUseDetailOutputWithoutAccountProps<T extends TradingType> = Omit<
    TradingUseDetailOutputProps<T>,
    'account'
>;

export interface TradingUseWatchTradeProps<T extends TradingType> {
    account: Account | undefined;
    trade: TradingTradeTransactionMapProps[T] | undefined;
}
