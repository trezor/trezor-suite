import { closeModal } from '@suite/modal';
import { createThunk } from '@suite-common/redux-utils';
import {
    STABLECOIN_YIELD_PREFIX,
    type StablecoinYieldRootState,
    selectStablecoinYieldTxReview,
} from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';

type CancelSignYieldTxThunkState = StablecoinYieldRootState;

export const cancelSignYieldTx = createThunk<void, void, { state: CancelSignYieldTxThunkState }>(
    `${STABLECOIN_YIELD_PREFIX}/thunk/cancelSignYieldTx`,
    (_params, { dispatch, getState }) => {
        const { serializedTx } = selectStablecoinYieldTxReview(getState());

        if (!serializedTx) {
            TrezorConnect.cancel({ reason: 'tx-cancelled' });
        }

        dispatch(closeModal());
    },
);
