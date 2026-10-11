import { closeModal } from '@suite/modal';
import {
    TRON_STAKE_PREFIX,
    type TronStakeRootState,
    selectTronStakeTxReview,
} from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';
import { createThunk } from '@trezor/redux-utils';

type CancelSignTronFreezeTxThunkState = TronStakeRootState;

export const cancelSignTronFreezeTxThunk = createThunk<
    void,
    void,
    { state: CancelSignTronFreezeTxThunkState }
>(`${TRON_STAKE_PREFIX}/thunk/cancelSignTronFreezeTx`, (_params, { dispatch, getState }) => {
    const { serializedTx } = selectTronStakeTxReview(getState());

    if (!serializedTx) {
        TrezorConnect.cancel({ reason: 'tx-cancelled' });
    }

    dispatch(closeModal());
});
