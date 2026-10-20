import { type SuiteSettingsRootState, selectLanguage } from '@suite/settings';
import {
    getPlaceholderCountryFromLocale,
    selectIsFinpromRestrictedByCountry,
} from '@suite-common/finprom';
import { type MessageSystemRootState } from '@suite-common/message-system';

type FinpromRootState = MessageSystemRootState & SuiteSettingsRootState;

const selectPresenceCountry = (state: SuiteSettingsRootState) =>
    getPlaceholderCountryFromLocale(selectLanguage(state));

export const selectIsFinpromRestricted = (state: FinpromRootState): boolean =>
    selectIsFinpromRestrictedByCountry(state, selectPresenceCountry(state));
