import {
    type GeolocationRootState,
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

type RegionsRootState = MessageSystemRootState & GeolocationRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<RegionsRootState>();

const isRestrictedByPresence = (
    feature: FeatureConfig | undefined,
    signals: PresenceSignals,
): boolean => {
    if (!feature?.flag) {
        return false;
    }

    const countries = getRegionRestrictedCountries(feature);

    if (countries.length === 0) {
        return false;
    }

    const { score, evidence } = estimatePresence(countries, signals);

    return evidence !== 'none' && score >= getRegionRestrictionThreshold(feature);
};

const selectPresenceRestrictionFeature = (state: MessageSystemRootState) =>
    selectFeatureConfig(state, Feature.regions.presenceRestriction);

const selectPresenceSignals = createMemoizedSelector(
    [selectCountryCode, selectDevicePresenceSignals],
    (ipCountry, deviceSignals): PresenceSignals => ({
        ipCountry,
        timeZone: deviceSignals?.timeZone ?? null,
        primaryRegion: deviceSignals?.primaryRegion ?? null,
        secondaryRegions: deviceSignals?.secondaryRegions ?? [],
    }),
);

export const selectIsRegionRestricted = createMemoizedSelector(
    [selectPresenceRestrictionFeature, selectPresenceSignals],
    isRestrictedByPresence,
);
