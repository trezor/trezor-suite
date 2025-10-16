import { TradingResidenceRootState } from '../reducers/residenceSlice';

export const selectTradingResidenceCountry = (state: TradingResidenceRootState) =>
    state.wallet.trading.residence.country;

export const selectWasTradingResidenceOnboardingVisited = (state: TradingResidenceRootState) =>
    state.wallet.trading.residence.onboardingCompleted;
