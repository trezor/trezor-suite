import { getReceiveAddressForFlowEntry, getReceiveAddressToAdd } from '@suite-common/address';
import { receiveActions, selectCurrentFreshAddress } from '@suite-common/receive';
import { createThunk } from '@suite-common/redux-utils';
import { type AccountKey } from '@suite-common/wallet-types';
import { asTypedNativeAnalytics, events } from '@suite-native/analytics';

import {
    type ReceiveAddressListRootState,
    selectIsReceiveAccountUtxoBased,
    selectReceiveAccount,
    selectReceiveAccountLabeledUnusedAddresses,
    selectReceiveAccountPendingAddresses,
    selectReceiveAccountTouchedAddresses,
} from './selectors';

const RECEIVE_THUNK_PREFIX = 'receive';

type AddReceiveAddressThunkParams = {
    accountKey: AccountKey;
};

export const setCurrentFreshAddressForFlowEntryThunk = createThunk<
    void,
    AddReceiveAddressThunkParams
>(
    `${RECEIVE_THUNK_PREFIX}/setCurrentFreshAddressForFlowEntry`,
    ({ accountKey }, { dispatch, getState }) => {
        const state = getState() as ReceiveAddressListRootState;
        const account = selectReceiveAccount(state, accountKey);
        const receiveAddressForFlowEntry = account
            ? getReceiveAddressForFlowEntry({
                  account,
                  touchedAddresses: selectReceiveAccountTouchedAddresses(state, accountKey),
                  labeledUnusedAddresses: selectReceiveAccountLabeledUnusedAddresses(
                      state,
                      accountKey,
                  ),
                  pendingAddresses: selectReceiveAccountPendingAddresses(state, accountKey),
                  isAccountUtxoBased: selectIsReceiveAccountUtxoBased(state, accountKey),
              })
            : undefined;

        dispatch(
            receiveActions.setCurrentFreshAddress({
                accountKey,
                currentFreshAddress: receiveAddressForFlowEntry,
            }),
        );
    },
);

export const addReceiveAddressThunk = createThunk<void, AddReceiveAddressThunkParams>(
    `${RECEIVE_THUNK_PREFIX}/addReceiveAddress`,
    ({ accountKey }, { dispatch, extra, getState }) => {
        const state = getState() as ReceiveAddressListRootState;
        const account = selectReceiveAccount(state, accountKey);

        if (!account) {
            return;
        }

        const touchedAddresses = selectReceiveAccountTouchedAddresses(state, accountKey);
        const pendingAddresses = selectReceiveAccountPendingAddresses(state, accountKey);
        const currentFreshAddress = selectCurrentFreshAddress(state, accountKey);
        const labeledUnusedAddresses = selectReceiveAccountLabeledUnusedAddresses(
            state,
            accountKey,
        );
        const isAccountUtxoBased = selectIsReceiveAccountUtxoBased(state, accountKey);
        const addressToAdd = getReceiveAddressToAdd({
            account,
            touchedAddresses,
            labeledUnusedAddresses,
            pendingAddresses,
            currentFreshAddress,
            isAccountUtxoBased,
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

        asTypedNativeAnalytics(extra.services.analytics).report({
            type: events.receiveAddAddressEvent.name,
        });
    },
);
