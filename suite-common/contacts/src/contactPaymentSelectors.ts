import {
    type SuiteSyncDataRootState,
    selectSuiteSyncContactAddresses,
    selectSuiteSyncContacts,
} from '@suite-common/suite-sync';
import {
    type SuiteSyncContact,
    type SuiteSyncContactAddress,
} from '@suite-common/suite-sync-storage';
import {
    type AccountsRootState,
    type TransactionsRootState,
    selectAccountByKey,
    selectAccountTransactions,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { parseStaticSessionId } from '@trezor/device-utils';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';

import {
    type PayableContact,
    getContactsSlip44,
    getPaidAddresses,
    getPayableContacts,
} from './contactPayments';

export type ContactPaymentsRootState = AccountsRootState &
    TransactionsRootState &
    SuiteSyncDataRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<ContactPaymentsRootState>();

const EMPTY_CONTACTS: SuiteSyncContact[] = [];
const EMPTY_CONTACT_ADDRESSES: SuiteSyncContactAddress[] = [];

const selectAccountWalletDescriptor = (state: ContactPaymentsRootState, accountKey: AccountKey) => {
    const account = selectAccountByKey(state, accountKey);

    return account ? parseStaticSessionId(account.deviceState).walletDescriptor : null;
};

/** The contacts of the wallet the account belongs to. */
export const selectAccountContacts = (state: ContactPaymentsRootState, accountKey: AccountKey) => {
    const walletDescriptor = selectAccountWalletDescriptor(state, accountKey);

    return walletDescriptor ? selectSuiteSyncContacts(state, walletDescriptor) : EMPTY_CONTACTS;
};

/** The attested contact addresses kept by the wallet the account belongs to. */
export const selectAccountContactAddresses = (
    state: ContactPaymentsRootState,
    accountKey: AccountKey,
) => {
    const walletDescriptor = selectAccountWalletDescriptor(state, accountKey);

    return walletDescriptor
        ? selectSuiteSyncContactAddresses(state, walletDescriptor)
        : EMPTY_CONTACT_ADDRESSES;
};

/** Every address the account's transactions pay to, pending transactions included. */
export const selectAccountPaidAddresses = createMemoizedSelector(
    [selectAccountTransactions],
    getPaidAddresses,
);

/** The contacts the account can pay now, each with the attested addresses nobody paid yet. */
export const selectPayableContacts = createMemoizedSelector(
    [
        selectAccountByKey,
        selectAccountContacts,
        selectAccountContactAddresses,
        selectAccountPaidAddresses,
    ],
    (account, contacts, contactAddresses, paidAddresses): PayableContact[] => {
        const slip44 = account ? getContactsSlip44(account) : undefined;

        if (slip44 === undefined) {
            return returnStableArrayIfEmpty<PayableContact>();
        }

        return returnStableArrayIfEmpty(
            getPayableContacts({ contacts, contactAddresses, slip44, paidAddresses }),
        );
    },
);
