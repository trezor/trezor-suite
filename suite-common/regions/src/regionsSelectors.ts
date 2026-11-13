import {
    type GeolocationRootState,
    type PresenceSignals,
    estimatePresence,
    selectDevicePresenceSignals,
    selectPresenceIpCountry,
} from '@suite-common/geolocation';
import {
    Feature,
    type MessageSystemRootState,
    getRegionRestrictedCountries,
    getRegionRestrictionThresholds,
    selectFeatureConfig,
} from '@suite-common/message-system';
import { type Feature as FeatureConfig } from '@suite-common/suite-types';
import { createWeakMapSelector } from '@trezor/redux-utils';

type RegionsRootState = MessageSystemRootState & GeolocationRootState;

const EMPTY_SECONDARY_REGIONS: readonly string[] = [];

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
    const thresholds = getRegionRestrictionThresholds(feature);

    if (evidence === 'strong') {
        return score >= thresholds.strong;
    }

    if (evidence === 'weak') {
        return score >= thresholds.weak;
    }

    return false;
};

const selectPresenceRestrictionFeature = (state: MessageSystemRootState) =>
    selectFeatureConfig(state, Feature.regions.presenceRestriction);

const selectPresenceSignals = createMemoizedSelector(
    [selectPresenceIpCountry, selectDevicePresenceSignals],
    (ipCountry, deviceSignals): PresenceSignals => ({
        ipCountry,
        timeZone: deviceSignals?.timeZone ?? null,
        primaryRegion: deviceSignals?.primaryRegion ?? null,
        secondaryRegions: deviceSignals?.secondaryRegions ?? EMPTY_SECONDARY_REGIONS,
    }),
);

export const selectIsRegionRestrictedBySignals = (
    state: MessageSystemRootState,
    signals: PresenceSignals,
): boolean => isRestrictedByPresence(selectPresenceRestrictionFeature(state), signals);

export const selectIsRegionRestricted = createMemoizedSelector(
    [selectPresenceRestrictionFeature, selectPresenceSignals],
    isRestrictedByPresence,
);
