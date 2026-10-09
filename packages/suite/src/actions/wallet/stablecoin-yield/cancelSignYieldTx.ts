import { closeModal } from '@suite/modal';
import { YIELD_PREFIX, type YieldRootState, selectYieldTxReview } from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';
import { createThunk } from '@trezor/redux-utils';

type CancelSignYieldTxThunkState = YieldRootState;

export const cancelSignYieldTxThunk = createThunk<
    void,
    void,
    { state: CancelSignYieldTxThunkState }
>(`${YIELD_PREFIX}/thunk/cancelSignYieldTx`, (_params, { dispatch, getState }) => {
    const { serializedTx } = selectYieldTxReview(getState());

    if (!serializedTx) {
        TrezorConnect.cancel({ reason: 'tx-cancelled' });
    }

    dispatch(closeModal());
});
