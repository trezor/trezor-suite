import { type DebugRootState, selectIsDebugModeActive } from '@suite/debug';
import { type SuiteSettingsRootState, selectIsContactsEnabled } from '@suite/settings';
import { getContactsSlip44 } from '@suite-common/contacts';
import { type DeviceRootState } from '@suite-common/device';
import {
    type SuiteSyncDataRootState,
    selectSuiteSyncContactAddresses,
} from '@suite-common/suite-sync';
import { type AccountsRootState, selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
import { type StaticSessionId } from '@trezor/connect';
import { parseStaticSessionId } from '@trezor/device-utils';
import { isDesktop } from '@trezor/env-utils';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';

export type ContactsAvailabilityRootState = DebugRootState & SuiteSettingsRootState;

/**
 * Contacts are a desktop proof of concept: paying a contact needs the wardd next to Suite desktop.
 * The Debug settings switch only counts while debug mode is on, like the rest of the debug tooling.
 */
export const selectIsContactsAvailable = (state: ContactsAvailabilityRootState) =>
    isDesktop() && selectIsDebugModeActive(state) && selectIsContactsEnabled(state);

/** The selected wallet's accounts a contact can be given an address of. */
export const selectContactShareableAccounts = createWeakMapSelector.withTypes<
    AccountsRootState & DeviceRootState
>()([selectVisibleDeviceAccounts], accounts =>
    returnStableArrayIfEmpty(accounts.filter(account => getContactsSlip44(account) !== undefined)),
);

type SelectContactUnspentAddressCountParams = {
    staticSessionId: StaticSessionId;
    npub: string;
};

/** How many addresses the contact shared that the wallet has not marked paid. */
export const selectContactUnspentAddressCount = (
    state: SuiteSyncDataRootState,
    { staticSessionId, npub }: SelectContactUnspentAddressCountParams,
) =>
    selectSuiteSyncContactAddresses(
        state,
        parseStaticSessionId(staticSessionId).walletDescriptor,
    ).filter(contactAddress => contactAddress.npub === npub && !contactAddress.isSpent).length;
