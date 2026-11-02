import { type CountryCode } from '@suite-common/geolocation';
import {
    Feature,
    type MessageSystemRootState,
    getRegionRestrictedCountries,
    selectFeatureConfig,
} from '@suite-common/message-system';

export const selectIsRegionRestrictedByCountry = (
    state: MessageSystemRootState,
    country: CountryCode | null,
): boolean => {
    if (country === null) {
        return false;
    }

    const feature = selectFeatureConfig(state, Feature.regions.presenceRestriction);

    if (!feature?.flag) {
        return false;
    }

    return getRegionRestrictedCountries(feature).includes(country);
};
