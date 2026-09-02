import { closeModal } from '@suite/modal';
import { createThunk } from '@suite-common/redux-utils';
import {
    TRON_STAKE_PREFIX,
    type TronStakeRootState,
    selectTronStakeTxReview,
} from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';

type CancelSignTronFreezeTxThunkState = TronStakeRootState;

export const cancelSignTronFreezeTx = createThunk<
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
