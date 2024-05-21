import type { State } from 'src/reducers/wallet/coinmarketReducer';
import type { BuyInfo } from 'src/actions/wallet/coinmarketBuyActions';
import type { ExchangeInfo } from 'src/actions/wallet/coinmarketExchangeActions';
import type { SellInfo } from 'src/actions/wallet/coinmarketSellActions';
import type { WithSelectedAccountLoadedProps } from 'src/components/wallet';
import type { CoinmarketTradeCommonProps } from 'src/reducers/wallet/coinmarketReducer';
import type { Account } from 'src/types/wallet';
import type {
    Trade,
    TradeBuy,
    TradeExchange,
    TradeSell,
    TradeType,
} from 'src/types/wallet/coinmarketCommonTypes';
import type { SelectedAccountLoaded } from '@suite-common/wallet-types';
import {
    BuyTradeStatus,
    ExchangeTradeStatus,
    SavingsTradeItemStatus,
    SellTradeStatus,
    WatchBuyTradeResponse,
    WatchExchangeTradeResponse,
    WatchSellTradeResponse,
} from 'invity-api';
import { AnyAction, Dispatch } from '@reduxjs/toolkit';

export type CoinmarketTradeBuyType = 'buy';
export type CoinmarketTradeSellType = 'sell';
export type CoinmarketTradeExchangeType = 'exchange';
export type CoinmarketTradeType =
    | CoinmarketTradeBuyType
    | CoinmarketTradeSellType
    | CoinmarketTradeExchangeType;

export type CoinmarketTradeMapProps = {
    buy: TradeBuy;
    sell: TradeSell;
    exchange: TradeExchange;
};

export type CoinmarketTradeInfoMapProps = {
    buy: BuyInfo;
    sell: SellInfo;
    exchange: ExchangeInfo;
};

export interface CoinmarketGetTypedTradeProps {
    trades: Trade[];
    tradeType: CoinmarketTradeType;
    transactionId: string | undefined;
}

export type CoinmarketTradeStatusType =
    | BuyTradeStatus
    | SellTradeStatus
    | ExchangeTradeStatus
    | SavingsTradeItemStatus;

export type CoinmarketUseBuyDetailProps = WithSelectedAccountLoadedProps;

export interface CoinmarketDetailContextValues<T extends CoinmarketTradeType>
    extends CoinmarketTradeCommonProps {
    account: Account;
    trade: CoinmarketTradeMapProps[T] | undefined;
    info?: CoinmarketTradeInfoMapProps[T] | undefined;
}

export interface CoinmarketGetDetailDataProps {
    coinmarket: State;
    tradeType: TradeType;
}

export interface CoinmarketGetTypedInfoTradeProps {
    coinmarket: State;
    tradeType: CoinmarketTradeType;
}

export interface CoinmarketGetDetailDataOutputProps<T extends CoinmarketTradeType> {
    transactionId?: string;
    info?: CoinmarketTradeInfoMapProps[T] | undefined;
    trade?: CoinmarketTradeMapProps[T] | undefined;
}

export interface CoinmarketUseDetailProps {
    selectedAccount: SelectedAccountLoaded;
    tradeType: TradeType;
}

export interface CoinmarketUseDetailOutputProps<T extends CoinmarketTradeType> {
    transactionId: string | undefined;
    info: CoinmarketTradeInfoMapProps[T] | undefined;
    trade: CoinmarketTradeMapProps[T] | undefined;
    account: Account;
}

export type CoinmarketWatchTradeResponseType =
    | WatchBuyTradeResponse
    | WatchExchangeTradeResponse
    | WatchSellTradeResponse;

export interface CoinmarketUseWatchTradeProps<T extends CoinmarketTradeType> {
    account: Account | undefined;
    trade: CoinmarketTradeMapProps[T] | undefined;
}

export interface CoinmarketWatchTradeProps<T extends CoinmarketTradeType> {
    trade: CoinmarketTradeMapProps[T];
    account: Account;
    refreshCount: number;
    dispatch: Dispatch<AnyAction>;
    removeDraft: (key: string) => void;
}
