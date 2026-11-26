import { type DebugRootState, selectIsDebugModeActive } from '@suite/debug';
import { type SuiteSettingsRootState, selectIsContactsEnabled } from '@suite/settings';
import { isDesktop } from '@trezor/env-utils';

type ContactsAvailabilityRootState = DebugRootState & SuiteSettingsRootState;

/**
 * Contacts are a desktop proof of concept: paying a contact needs the wardd next to Suite desktop.
 * The Debug settings switch only counts while debug mode is on, like the rest of the debug tooling.
 */
export const selectIsContactsAvailable = (state: ContactsAvailabilityRootState) =>
    isDesktop() && selectIsDebugModeActive(state) && selectIsContactsEnabled(state);
