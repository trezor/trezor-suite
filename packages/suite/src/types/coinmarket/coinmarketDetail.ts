import type { State } from 'src/reducers/wallet/coinmarketReducer';
import type { BuyInfo } from 'src/actions/wallet/coinmarketBuyActions';
import type { ExchangeInfo } from 'src/actions/wallet/coinmarketExchangeActions';
import type { SellInfo } from 'src/actions/wallet/coinmarketSellActions';
import type { WithSelectedAccountLoadedProps } from 'src/components/wallet';
import type { CoinmarketTradeCommonProps } from 'src/reducers/wallet/coinmarketReducer';
import type { Account } from 'src/types/wallet';
import type { Trade, TradeType } from 'src/types/wallet/coinmarketCommonTypes';
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

export type TradeStatus =
    | BuyTradeStatus
    | SellTradeStatus
    | ExchangeTradeStatus
    | SavingsTradeItemStatus;

export type UseCoinmarketBuyDetailProps = WithSelectedAccountLoadedProps;

export interface CoinmarketDetailContextValues extends CoinmarketTradeCommonProps {
    account: Account;
    trade: Trade | undefined;
    info?: BuyInfo | SellInfo | ExchangeInfo;
}

export interface GetCoinmarketDetailDataProps {
    coinmarket: State;
    tradeType: TradeType;
}

export interface UseCoinmarketDetailProps {
    selectedAccount: SelectedAccountLoaded;
    tradeType: TradeType;
}

export type WatchTradeResponse =
    | WatchBuyTradeResponse
    | WatchExchangeTradeResponse
    | WatchSellTradeResponse
    | null;

export interface UseCoinmarketWatchTradeProps {
    account: Account | undefined;
    trade: Trade | undefined;
}

export interface CoinmarketWatchTradeProps {
    trade: Trade;
    account: Account;
    refreshCount: number;
    dispatch: Dispatch<AnyAction>;
    removeDraft: (key: string) => void;
}
