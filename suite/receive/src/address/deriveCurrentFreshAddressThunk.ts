import { type Dispatch } from '@reduxjs/toolkit';

import {
    type SelectLabeledUnusedAddressesState,
    selectLabeledUnusedAddresses,
} from '@suite/address';
import { getFirstFreshAddress } from '@suite-common/address';
import {
    type ReceiveRootState,
    receiveActions,
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

type DeriveCurrentFreshAddressState = AccountsRootState &
    TransactionsRootState &
    ReceiveRootState &
    SelectLabeledUnusedAddressesState;

export const deriveCurrentFreshAddressThunk =
    ({ accountKey }: { accountKey: AccountKey }) =>
    (dispatch: Dispatch, getState: () => DeriveCurrentFreshAddressState) => {
        const account = selectAccountByKey(getState(), accountKey);

        if (!account) {
            return;
        }

        const currentFreshAddress = selectCurrentFreshAddress(getState(), accountKey);
        const alreadyUsedExceptCurrentFresh = selectLabeledUnusedAddresses(getState(), account)
            .concat(selectTouchedAddresses(getState(), accountKey))
            .filter(address => address.path !== currentFreshAddress?.path);

        const firstFreshAddress = getFirstFreshAddress(
            account,
            alreadyUsedExceptCurrentFresh,
            selectPendingAccountAddresses(getState(), accountKey),
            selectIsAccountUtxoBased(getState(), accountKey),
        );

        const hasChanged =
            currentFreshAddress?.path !== firstFreshAddress?.path ||
            currentFreshAddress?.address !== firstFreshAddress?.address;

        if (!hasChanged) {
            return;
        }

        dispatch(
            receiveActions.setCurrentFreshAddress({
                accountKey,
                currentFreshAddress: firstFreshAddress,
            }),
        );
    };
