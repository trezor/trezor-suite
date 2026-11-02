import { type CountryCode } from '@suite-common/geolocation';
import {
    Feature,
    type MessageSystemRootState,
    getFinpromRestrictedCountries,
    selectFeatureConfig,
} from '@suite-common/message-system';

export const selectIsFinpromRestrictedByCountry = (
    state: MessageSystemRootState,
    country: CountryCode | null,
): boolean => {
    if (country === null) {
        return false;
    }

    const feature = selectFeatureConfig(state, Feature.finprom.presenceRestriction);

    if (!feature?.flag) {
        return false;
    }

    return getFinpromRestrictedCountries(feature).includes(country);
};
