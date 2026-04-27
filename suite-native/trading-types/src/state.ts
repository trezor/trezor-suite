import type { ProviderMetadata } from 'invity-api';

import type {
    TradingBuyState as CommonTradingBuyState,
    TradingExchangeState as CommonTradingExchangeState,
    TradingSellState as CommonTradingSellState,
    TradingState as CommonTradingState,
    InvityServerEnvironment,
    TradingCountryCode,
    TradingType,
} from '@suite-common/trading';

import type { ProviderConfirmationStatus } from './general';

export interface TradingBuyState extends CommonTradingBuyState {}

export interface TradingExchangeState extends CommonTradingExchangeState {}

export interface TradingSellState extends CommonTradingSellState {}

export type TradingResidenceState = {
    country: TradingCountryCode | undefined;
    countrySubdivision: string | undefined;
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
    tradingEnvironment: InvityServerEnvironment;
    tradeOrderIdToBeOpened: string | undefined;
    isAmountInputActive: boolean;
    activeTradingType: TradingType | undefined;
    providerConfirmationStatus: ProviderConfirmationStatus;
    currentProviderMetadata: ProviderMetadata | undefined;
}

export type TradingRootState = {
    wallet: {
        trading: TradingState;
    };
};
