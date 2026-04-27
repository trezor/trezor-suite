import {
    FeatureFlag,
    type FeatureFlagsRootState,
    selectIsFeatureFlagEnabled,
} from '@suite-native/feature-flags';
import { tradingCountriesWhitelistSet } from '@suite-native/trading-consts';
import { type TradingResidenceRootState } from '@suite-native/trading-types';

export const selectTradingResidenceCountry = (state: TradingResidenceRootState) =>
    state.wallet.trading.residence.country;

export const selectTradingResidenceCountrySubdivision = (state: TradingResidenceRootState) =>
    state.wallet.trading.residence.countrySubdivision;

export const selectWasTradingResidenceOnboardingVisited = (state: TradingResidenceRootState) =>
    state.wallet.trading.residence.wasOnboardingVisited;

export const selectIsTradingResidenceCheckEnabled = (state: FeatureFlagsRootState) =>
    selectIsFeatureFlagEnabled(state, FeatureFlag.IsTradingResidenceCheckEnabled);

export const selectIsTradingEnabledForCountry = (
    state: TradingResidenceRootState & FeatureFlagsRootState,
) => {
    const isResidenceCheckEnabled = selectIsTradingResidenceCheckEnabled(state);
    if (!isResidenceCheckEnabled) {
        return true;
    }

    const country = selectTradingResidenceCountry(state);
    if (!country) {
        return false;
    }

    return tradingCountriesWhitelistSet.has(country);
};

export const selectIsTradingCountrySet = (state: TradingResidenceRootState) =>
    selectTradingResidenceCountry(state) !== undefined;

export const selectShouldDisplayTradingResidenceOnboarding = (
    state: TradingResidenceRootState & FeatureFlagsRootState,
) => {
    const isResidenceCheckEnabled = selectIsTradingResidenceCheckEnabled(state);
    const wasOnboardingVisited = selectWasTradingResidenceOnboardingVisited(state);
    const isCountrySet = selectIsTradingCountrySet(state);

    return isResidenceCheckEnabled && !wasOnboardingVisited && !isCountrySet;
};
