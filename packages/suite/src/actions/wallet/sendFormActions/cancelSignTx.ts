import TrezorConnect from '@trezor/connect';
import { Dispatch, GetState } from 'src/types/suite';
import * as modalActions from 'src/actions/suite/modalActions';
import { SEND } from 'src/actions/wallet/constants';

// this could be called at any time during signTransaction or pushTransaction process (from TransactionReviewModal)
export const cancelSignTx = () => (dispatch: Dispatch, getState: GetState) => {
    const { signedTx } = getState().wallet.send;
    dispatch({ type: SEND.REQUEST_SIGN_TRANSACTION });
    dispatch({ type: SEND.REQUEST_PUSH_TRANSACTION });
    // if transaction is not signed yet interrupt signing in TrezorConnect
    if (!signedTx) {
        TrezorConnect.cancel('tx-cancelled');
        return;
    }
    // otherwise just close modal
    dispatch(modalActions.onCancel());
};
