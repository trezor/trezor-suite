import { type Dispatch } from '@reduxjs/toolkit';

import {
    type SelectLabeledUnusedAddressesState,
    selectLabeledUnusedAddresses,
} from '@suite/address';
import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import { getReceiveAddressToAdd } from '@suite-common/address';
import {
    type ReceiveRootState,
    receiveActions,
    selectCurrentFreshAddress,
    selectTouchedAddresses,
} from '@suite-common/receive';
import { type WithServices } from '@suite-common/redux-utils';
import {
    type AccountsRootState,
    type TransactionsRootState,
    selectAccountByKey,
    selectIsAccountUtxoBased,
    selectPendingAccountAddresses,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';

type RevealNextAddressThunkState = AccountsRootState &
    TransactionsRootState &
    ReceiveRootState &
    SelectLabeledUnusedAddressesState;

type RevealNextAddressThunkDeps = WithServices<DesktopAnalyticsDep>;

type RevealNextAddressThunkParams = { accountKey: AccountKey };

export const revealNextAddressThunk =
    ({ accountKey }: RevealNextAddressThunkParams) =>
    (
        dispatch: Dispatch,
        getState: () => RevealNextAddressThunkState,
        extra: RevealNextAddressThunkDeps,
    ) => {
        const account = selectAccountByKey(getState(), accountKey);

        if (!account) {
            return;
        }

        const currentFreshAddress = selectCurrentFreshAddress(getState(), accountKey);
        const addressToAdd = getReceiveAddressToAdd({
            account,
            touchedAddresses: selectTouchedAddresses(getState(), accountKey),
            labeledUnusedAddresses: selectLabeledUnusedAddresses(getState(), account),
            pendingAddresses: selectPendingAccountAddresses(getState(), accountKey),
            currentFreshAddress,
            isAccountUtxoBased: selectIsAccountUtxoBased(getState(), accountKey),
        });

        if (!addressToAdd) {
            return;
        }

        dispatch(
            receiveActions.touchAddress({
                accountKey,
                path: addressToAdd.path,
                address: addressToAdd.address,
            }),
        );

        dispatch(
            receiveActions.setCurrentFreshAddress({
                accountKey,
                currentFreshAddress: addressToAdd,
            }),
        );

        extra.services.analytics.report({ type: events.receiveAddAddressEvent.name });
    };
