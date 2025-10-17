import {
    FeatureFlag,
    FeatureFlagsRootState,
    selectIsFeatureFlagEnabled,
} from '@suite-native/feature-flags';

import type { TradingResidenceRootState } from '../reducers/residenceSlice';
import { tradingCountriesWhitelistSet } from '../utils/countriesWhitelist';

export const selectTradingResidenceCountry = (state: TradingResidenceRootState) =>
    state.wallet.trading.residence.country;

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
