import { getReceiveAddressForFlowEntry, getReceiveAddressToAdd } from '@suite-common/address';
import { receiveActions, selectCurrentFreshAddress } from '@suite-common/receive';
import { type WithServices, createThunk } from '@suite-common/redux-utils';
import { type AccountKey } from '@suite-common/wallet-types';
import { type NativeAnalyticsDep, events } from '@suite-native/analytics';

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

export type SetCurrentFreshAddressForFlowEntryThunkState = ReceiveAddressListRootState;

export const setCurrentFreshAddressForFlowEntryThunk = createThunk<
    void,
    AddReceiveAddressThunkParams,
    { state: SetCurrentFreshAddressForFlowEntryThunkState }
>(
    `${RECEIVE_THUNK_PREFIX}/setCurrentFreshAddressForFlowEntry`,
    ({ accountKey }, { dispatch, getState }) => {
        const account = selectReceiveAccount(getState(), accountKey);
        const receiveAddressForFlowEntry = account
            ? getReceiveAddressForFlowEntry({
                  account,
                  touchedAddresses: selectReceiveAccountTouchedAddresses(getState(), accountKey),
                  labeledUnusedAddresses: selectReceiveAccountLabeledUnusedAddresses(
                      getState(),
                      accountKey,
                  ),
                  pendingAddresses: selectReceiveAccountPendingAddresses(getState(), accountKey),
                  isAccountUtxoBased: selectIsReceiveAccountUtxoBased(getState(), accountKey),
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

export type AddReceiveAddressThunkState = ReceiveAddressListRootState;

export type AddReceiveAddressThunkDeps = WithServices<NativeAnalyticsDep>;

export const addReceiveAddressThunk = createThunk<
    void,
    AddReceiveAddressThunkParams,
    { state: AddReceiveAddressThunkState; extra: AddReceiveAddressThunkDeps }
>(`${RECEIVE_THUNK_PREFIX}/addReceiveAddress`, ({ accountKey }, { dispatch, extra, getState }) => {
    const account = selectReceiveAccount(getState(), accountKey);

    if (!account) {
        return;
    }

    const touchedAddresses = selectReceiveAccountTouchedAddresses(getState(), accountKey);
    const pendingAddresses = selectReceiveAccountPendingAddresses(getState(), accountKey);
    const currentFreshAddress = selectCurrentFreshAddress(getState(), accountKey);
    const labeledUnusedAddresses = selectReceiveAccountLabeledUnusedAddresses(
        getState(),
        accountKey,
    );
    const isAccountUtxoBased = selectIsReceiveAccountUtxoBased(getState(), accountKey);
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

    extra.services.analytics.report({
        type: events.receiveAddAddressEvent.name,
    });
});
