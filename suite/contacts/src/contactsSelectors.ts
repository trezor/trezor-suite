import { type DebugRootState, selectIsDebugModeActive } from '@suite/debug';
import {
    type SuiteSettingsRootState,
    selectContactsRelayUrlsSetting,
    selectIsContactsEnabled,
} from '@suite/settings';
import { getContactsRelayUrls, getContactsSlip44 } from '@suite-common/contacts';
import { type DeviceRootState } from '@suite-common/device';
import {
    type SuiteSyncDataRootState,
    selectSuiteSyncContactAddresses,
} from '@suite-common/suite-sync';
import { type NetworkSymbol } from '@suite-common/wallet-config';
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

export type ContactsNetwork = {
    slip44: number;
    /** Of the wallet's first account with the SLIP-44, to name it. */
    networkSymbol: NetworkSymbol;
};

/** The SLIP-44 coin types the selected wallet has contacts accounts of, once each. */
export const selectContactsNetworks = createWeakMapSelector.withTypes<
    AccountsRootState & DeviceRootState
>()([selectContactShareableAccounts], accounts =>
    returnStableArrayIfEmpty(
        accounts.reduce<ContactsNetwork[]>((networks, account) => {
            const slip44 = getContactsSlip44(account);

            if (slip44 === undefined || networks.some(network => network.slip44 === slip44)) {
                return networks;
            }

            return [...networks, { slip44, networkSymbol: account.symbol }];
        }, []),
    ),
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

/** The relays of the contacts exchange, the same array as long as the setting stays. */
export const selectContactsRelayUrls = createWeakMapSelector.withTypes<SuiteSettingsRootState>()(
    [selectContactsRelayUrlsSetting],
    getContactsRelayUrls,
);
