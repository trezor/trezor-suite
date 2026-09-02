import { closeModal } from '@suite/modal';
import { createThunk } from '@suite-common/redux-utils';
import { YIELD_PREFIX, type YieldRootState, selectYieldTxReview } from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';

type CancelSignYieldTxThunkState = YieldRootState;

export const cancelSignYieldTx = createThunk<void, void, { state: CancelSignYieldTxThunkState }>(
    `${YIELD_PREFIX}/thunk/cancelSignYieldTx`,
    (_params, { dispatch, getState }) => {
        const { serializedTx } = selectYieldTxReview(getState());

        if (!serializedTx) {
            TrezorConnect.cancel({ reason: 'tx-cancelled' });
        }

        dispatch(closeModal());
    },
);
