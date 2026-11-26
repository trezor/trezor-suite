import {
    type SuiteSyncContact,
    type SuiteSyncContactAddress,
} from '@suite-common/suite-sync-storage';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';
import { typedObjectValues } from '@trezor/utils';

import { type SuiteSyncDataRootState } from '../suiteSyncDataReducer';
import { selectWalletById } from '../wallet/suiteSyncWalletSelectors';

const createMemoizedSelector = createWeakMapSelector.withTypes<SuiteSyncDataRootState>();

const compareContactsByName = (a: SuiteSyncContact, b: SuiteSyncContact) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });

/** The wallet's contacts, by name; removed contacts are left out. */
export const selectSuiteSyncContacts = createMemoizedSelector(
    [(state, walletDescriptor) => selectWalletById(state, walletDescriptor)],
    wallet => {
        const contacts = typedObjectValues(wallet?.contacts ?? {}).filter(
            contact => !contact.isDeleted,
        );

        return returnStableArrayIfEmpty(contacts.toSorted(compareContactsByName));
    },
);

/** Every address the wallet's contacts attested, including those of removed contacts. */
export const selectSuiteSyncContactAddresses = createMemoizedSelector(
    [(state, walletDescriptor) => selectWalletById(state, walletDescriptor)],
    wallet => {
        if (wallet === null) {
            return returnStableArrayIfEmpty<SuiteSyncContactAddress>();
        }

        return returnStableArrayIfEmpty(typedObjectValues(wallet.contactAddresses));
    },
);
