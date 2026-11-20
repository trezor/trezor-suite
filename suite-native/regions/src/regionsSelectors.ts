import { type MessageSystemRootState } from '@suite-common/message-system';
import {
    getPlaceholderCountryFromLocale,
    selectIsRegionRestrictedByCountry,
} from '@suite-common/regions';
import { type LocaleSliceRootState, selectSupportedLanguageLocale } from '@suite-native/intl';

type RegionsRootState = MessageSystemRootState & LocaleSliceRootState;

const selectPresenceCountry = (state: LocaleSliceRootState) =>
    getPlaceholderCountryFromLocale(selectSupportedLanguageLocale(state));

export const selectIsRegionRestricted = (state: RegionsRootState): boolean =>
    selectIsRegionRestrictedByCountry(state, selectPresenceCountry(state));
