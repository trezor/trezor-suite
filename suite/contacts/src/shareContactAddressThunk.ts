import {
    type SelectLabeledUnusedAddressesState,
    selectLabeledUnusedAddresses,
} from '@suite/address';
import { getReceiveAddressToAdd } from '@suite-common/address';
import {
    type AttestContactAddressThunkState,
    type ContactAddressShare,
    type ContactsError,
    attestContactAddressThunk,
} from '@suite-common/contacts';
import {
    type ReceiveRootState,
    selectCurrentFreshAddress,
    selectTouchedAddresses,
} from '@suite-common/receive';
import {
    type AccountsRootState,
    type TransactionsRootState,
    selectAccountByKey,
    selectIsAccountUtxoBased,
    selectPendingAccountAddresses,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { createThunk } from '@trezor/redux-utils';
import { type Result, err } from '@trezor/type-utils';

type ShareContactAddressThunkParams = {
    accountKey: AccountKey;
};

export type ShareContactAddressThunkState = AccountsRootState &
    TransactionsRootState &
    ReceiveRootState &
    SelectLabeledUnusedAddressesState &
    AttestContactAddressThunkState;

/**
 * Shares the account's next fresh receive address with a contact, as the Trezor attests it. Like
 * "Reveal next address", it skips every address Suite already handed out, labeled or used, so a
 * contact never gets an address someone else may pay to.
 */
export const shareContactAddressThunk = createThunk<
    Result<ContactAddressShare, ContactsError>,
    ShareContactAddressThunkParams,
    { state: ShareContactAddressThunkState }
>('@suite/contacts/shareContactAddressThunk', async ({ accountKey }, { dispatch, getState }) => {
    const account = selectAccountByKey(getState(), accountKey);

    if (!account) {
        return err({ type: 'UnsupportedAccount' });
    }

    const address = getReceiveAddressToAdd({
        account,
        touchedAddresses: selectTouchedAddresses(getState(), accountKey),
        labeledUnusedAddresses: selectLabeledUnusedAddresses(getState(), account),
        pendingAddresses: selectPendingAccountAddresses(getState(), accountKey),
        currentFreshAddress: selectCurrentFreshAddress(getState(), accountKey),
        isAccountUtxoBased: selectIsAccountUtxoBased(getState(), accountKey),
    });

    if (!address) {
        return err({ type: 'NoFreshAddress' });
    }

    const shared = await dispatch(
        attestContactAddressThunk({ accountKey, path: address.path, address: address.address }),
    ).unwrap();

    return shared;
});
