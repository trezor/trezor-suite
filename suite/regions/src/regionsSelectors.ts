import { type SuiteSettingsRootState, selectLanguage } from '@suite/settings';
import { type MessageSystemRootState } from '@suite-common/message-system';
import {
    getPlaceholderCountryFromLocale,
    selectIsRegionRestrictedByCountry,
} from '@suite-common/regions';

type RegionsRootState = MessageSystemRootState & SuiteSettingsRootState;

const selectPresenceCountry = (state: SuiteSettingsRootState) =>
    getPlaceholderCountryFromLocale(selectLanguage(state));

export const selectIsRegionRestricted = (state: RegionsRootState): boolean =>
    selectIsRegionRestrictedByCountry(state, selectPresenceCountry(state));
