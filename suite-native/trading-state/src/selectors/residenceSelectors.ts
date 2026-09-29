import {
    Feature,
    type MessageSystemRootState,
    getTradingResidenceWhitelist,
    selectFeatureConfig,
} from '@suite-common/message-system';
import { type TradingCountryCode, isCountrySubdivisionEmpty } from '@suite-common/trading';
import { type TradingResidenceRootState } from '@suite-native/trading-types';
import { createWeakMapSelector } from '@trezor/redux-utils';

import { selectIsTradingResidenceWhitelistRequired } from './residenceWhitelistRequired';

const createMessageSystemMemoizedSelector =
    createWeakMapSelector.withTypes<MessageSystemRootState>();

export const selectTradingResidenceCountry = (state: TradingResidenceRootState) =>
    state.wallet.trading.residence.country;

export const selectTradingResidenceCountrySubdivision = (state: TradingResidenceRootState) =>
    state.wallet.trading.residence.countrySubdivision;

export const selectWasTradingResidenceOnboardingVisited = (state: TradingResidenceRootState) =>
    state.wallet.trading.residence.wasOnboardingVisited;

export const selectTradingResidenceWhitelist = createMessageSystemMemoizedSelector(
    [state => selectFeatureConfig(state, Feature.trading.restrictions.residenceWhitelistRequired)],
    feature => new Set<TradingCountryCode>(getTradingResidenceWhitelist(feature)),
);

export const selectIsTradingEnabledForLocation = (
    state: MessageSystemRootState,
    country: TradingCountryCode | undefined,
    countrySubdivision: string | undefined,
) => {
    if (!selectIsTradingResidenceWhitelistRequired(state)) {
        return true;
    }

    if (!country || isCountrySubdivisionEmpty(country, countrySubdivision)) {
        return false;
    }

    return selectTradingResidenceWhitelist(state).has(country);
};

export const selectIsTradingEnabledForCountry = (
    state: TradingResidenceRootState & MessageSystemRootState,
) =>
    selectIsTradingEnabledForLocation(
        state,
        selectTradingResidenceCountry(state),
        selectTradingResidenceCountrySubdivision(state),
    );

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
    const isResidenceWhitelistRequired = selectIsTradingResidenceWhitelistRequired(state);
    const wasOnboardingVisited = selectWasTradingResidenceOnboardingVisited(state);
    const isCountrySet = selectIsTradingCountrySet(state);

    return isResidenceWhitelistRequired && !wasOnboardingVisited && !isCountrySet;
};
