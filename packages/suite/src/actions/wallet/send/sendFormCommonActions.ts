import * as storageActions from '@suite-actions/storageActions';
import { Dispatch, GetState } from '@suite-types';
import { SEND } from '@wallet-actions/constants';
import { getAccountKey } from '@wallet-utils/accountUtils';

/*
    Cache action in send form
*/

export const cache = (touch = true) => async (dispatch: Dispatch, getState: GetState) => {
    const { account } = getState().wallet.selectedAccount;
    const { send } = getState().wallet;
    if (!account || !send) return null;

    if (touch && !send.touched) {
        dispatch({
            type: SEND.SET_TOUCHED,
            touched: true,
        });
    }

    const id = getAccountKey(account.descriptor, account.symbol, account.deviceState);
    const sendFormState = send;
    storageActions.saveSendForm(sendFormState, id);
};
