import {
    Feature,
    type MessageSystemRootState,
    createMemoizedSelector,
    getTradingResidenceCountries,
    selectFeatureConfig,
} from '@suite-common/message-system';
import { type TradingCountryCode, isCountrySubdivisionEmpty } from '@suite-common/trading';
import { type TradingResidenceRootState } from '@suite-native/trading-types';

import { selectIsTradingResidenceCheckEnabled } from './residenceCheck';

export const selectTradingResidenceCountry = (state: TradingResidenceRootState) =>
    state.wallet.trading.residence.country;

export const selectTradingResidenceCountrySubdivision = (state: TradingResidenceRootState) =>
    state.wallet.trading.residence.countrySubdivision;

export const selectWasTradingResidenceOnboardingVisited = (state: TradingResidenceRootState) =>
    state.wallet.trading.residence.wasOnboardingVisited;

export const selectTradingResidenceWhitelist = createMemoizedSelector(
    [state => selectFeatureConfig(state, Feature.trading.restrictions.residence)],
    feature => new Set<TradingCountryCode>(getTradingResidenceCountries(feature)),
);

export const selectIsTradingEnabledForCountry = (
    state: TradingResidenceRootState & MessageSystemRootState,
) => {
    const isResidenceCheckEnabled = selectIsTradingResidenceCheckEnabled(state);
    if (!isResidenceCheckEnabled) {
        return true;
    }

    const country = selectTradingResidenceCountry(state);

    if (!country) {
        return false;
    }
    const countrySubdivision = selectTradingResidenceCountrySubdivision(state);

    if (isCountrySubdivisionEmpty(country, countrySubdivision)) {
        return false;
    }

    return selectTradingResidenceWhitelist(state).has(country);
};

export const selectIsTradingCountrySet = (state: TradingResidenceRootState) => {
    const country = selectTradingResidenceCountry(state);

    return (
        country !== undefined &&
        !isCountrySubdivisionEmpty(country, selectTradingResidenceCountrySubdivision(state))
    );
};
export const selectShouldDisplayTradingResidenceOnboarding = (
    state: TradingResidenceRootState & MessageSystemRootState,
) => {
    const isResidenceCheckEnabled = selectIsTradingResidenceCheckEnabled(state);
    const wasOnboardingVisited = selectWasTradingResidenceOnboardingVisited(state);
    const isCountrySet = selectIsTradingCountrySet(state);

    return isResidenceCheckEnabled && !wasOnboardingVisited && !isCountrySet;
};
