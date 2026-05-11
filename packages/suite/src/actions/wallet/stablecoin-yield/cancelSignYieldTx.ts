import { closeModal } from '@suite/modal';
import { createThunk } from '@suite-common/redux-utils';
import { STABLECOIN_YIELD_PREFIX, selectStablecoinYieldTxReview } from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';

export const cancelSignYieldTx = createThunk(
    `${STABLECOIN_YIELD_PREFIX}/thunk/cancelSignYieldTx`,
    (_params, { dispatch, getState }) => {
        const { serializedTx } = selectStablecoinYieldTxReview(getState());

        if (!serializedTx) {
            TrezorConnect.cancel('tx-cancelled');
        }

        dispatch(closeModal());
    },
);
