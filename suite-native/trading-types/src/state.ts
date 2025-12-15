import type { CryptoId } from 'invity-api';

import {
    type TradingBuyState as CommonTradingBuyState,
    type TradingExchangeState as CommonTradingExchangeState,
    type TradingSellState as CommonTradingSellState,
    type TradingState as CommonTradingState,
    type InvityServerEnvironment,
    type TradingCountryCode,
    type TradingType,
} from '@suite-common/trading';

export interface TradingBuyState extends CommonTradingBuyState {}

export interface TradingExchangeState extends CommonTradingExchangeState {}

export interface TradingSellState extends CommonTradingSellState {}

export type TradingResidenceState = {
    country: TradingCountryCode | undefined;
    wasOnboardingVisited: boolean;
};

export type TradingResidenceRootState = {
    wallet: {
        trading: {
            residence: TradingResidenceState;
        };
    };
};

export interface TradingState extends CommonTradingState {
    buy: TradingBuyState;
    exchange: TradingExchangeState;
    sell: TradingSellState;
    residence: TradingResidenceState;
    favouriteAssets: Record<CryptoId, true>;
    tradingEnvironment: InvityServerEnvironment;
    tradeOrderIdToBeOpened: string | undefined;
    isAmountInputActive: boolean;
    activeTradingType: TradingType | undefined;
}

export type TradingRootState = {
    wallet: {
        trading: TradingState;
    };
};
