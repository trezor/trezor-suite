import {
    type GeolocationRootState,
    type PresenceEstimate,
    type PresenceSignals,
    estimatePresence,
    selectCountryCode,
    selectDevicePresenceSignals,
} from '@suite-common/geolocation';
import {
    Feature,
    type MessageSystemRootState,
    getRegionRestrictedCountries,
    getRegionRestrictionThreshold,
    selectFeatureConfig,
} from '@suite-common/message-system';
import { type Feature as FeatureConfig } from '@suite-common/suite-types';
import { createWeakMapSelector } from '@trezor/redux-utils';

export type RegionsRootState = MessageSystemRootState & GeolocationRootState;

export const createRegionsSelector = createWeakMapSelector.withTypes<RegionsRootState>();

export type PresenceRestriction = { estimate: PresenceEstimate | null; isRestricted: boolean };

const NOT_EVALUATED: PresenceRestriction = { estimate: null, isRestricted: false };

const getPresenceRestriction = (
    feature: FeatureConfig | undefined,
    signals: PresenceSignals,
): PresenceRestriction => {
    if (!feature?.flag) {
        return NOT_EVALUATED;
    }

    const countries = getRegionRestrictedCountries(feature);

    if (countries.length === 0) {
        return NOT_EVALUATED;
    }

    const estimate = estimatePresence(countries, signals);

    return {
        estimate,
        isRestricted:
            estimate.evidence !== 'none' &&
            estimate.score >= getRegionRestrictionThreshold(feature),
    };
};

export const selectPresenceRestrictionFeature = (state: MessageSystemRootState) =>
    selectFeatureConfig(state, Feature.regions.presenceRestriction);

export const selectPresenceSignals = createRegionsSelector(
    [selectCountryCode, selectDevicePresenceSignals],
    (ipCountry, deviceSignals): PresenceSignals => ({
        ipCountry,
        timeZone: deviceSignals?.timeZone ?? null,
        primaryRegion: deviceSignals?.primaryRegion ?? null,
        secondaryRegions: deviceSignals?.secondaryRegions ?? [],
    }),
);

export const selectPresenceRestriction = createRegionsSelector(
    [selectPresenceRestrictionFeature, selectPresenceSignals],
    getPresenceRestriction,
);

export const selectIsRegionRestricted = (state: RegionsRootState) =>
    selectPresenceRestriction(state).isRestricted;
