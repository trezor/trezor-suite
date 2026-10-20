import { type CountryCode } from '@suite-common/geolocation';
import {
    Feature,
    type MessageSystemRootState,
    selectFeatureConfig,
    selectIsFeatureEnabled,
} from '@suite-common/message-system';

import { getFinpromRestrictedCountries } from './finpromPayload';

export const selectIsFinpromRestrictedByCountry = (
    state: MessageSystemRootState,
    country: CountryCode | null,
): boolean => {
    if (country === null) {
        return false;
    }

    if (!selectIsFeatureEnabled(state, Feature.finprom.presenceRestriction, false)) {
        return false;
    }

    const restrictedCountries = getFinpromRestrictedCountries(
        selectFeatureConfig(state, Feature.finprom.presenceRestriction),
    );

    return restrictedCountries.includes(country);
};
