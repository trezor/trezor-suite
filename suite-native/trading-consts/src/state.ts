import { initialState as commonInitialState } from '@suite-common/trading';
import type { TradingResidenceState, TradingState } from '@suite-native/trading-types';

export const residenceInitialState: TradingResidenceState = {
    country: undefined,
    countrySubdivision: undefined,
    wasOnboardingVisited: false,
};

export const tradingInitialState: TradingState = {
    ...commonInitialState,
    residence: residenceInitialState,
    tradingEnvironment: 'production',
    tradeOrderIdToBeOpened: undefined,
    isAmountInputActive: false,
    activeTradingType: undefined,
    providerConfirmationStatus: 'inactive',
    currentProviderMetadata: undefined,
};
