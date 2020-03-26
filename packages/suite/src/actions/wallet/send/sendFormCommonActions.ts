import * as storageActions from '@suite-actions/storageActions';
import { Dispatch, GetState } from '@suite-types';
import { SEND } from '@wallet-actions/constants';
import { getAccountKey } from '@wallet-utils/accountUtils';
import { getLocalCurrency } from '@wallet-utils/settingsUtils';

/*
    Cache action in send form
*/

export const cache = () => async (dispatch: Dispatch, getState: GetState) => {
    dispatch({
        type: SEND.SET_TOUCHED,
        touched: true,
    });

    const { account } = getState().wallet.selectedAccount;
    const { send } = getState().wallet;
    if (!account || !send) return null;

    const id = getAccountKey(account.descriptor, account.symbol, account.deviceState);
    const sendFormState = send;
    storageActions.saveSendForm(sendFormState, id);
};

/*
    Clear to default state
*/
export const clear = () => (dispatch: Dispatch, getState: GetState) => {
    const { send, settings } = getState().wallet;
    const { account } = getState().wallet.selectedAccount;
    if (!send || !account) return;

    const localCurrency = getLocalCurrency(settings.localCurrency);

    dispatch({ type: SEND.CLEAR, localCurrency });
    // remove sendForm from the DB here or in storageMiddleware on SEND.CLEAR?
    storageActions.removeSendForm(
        getAccountKey(account.descriptor, account.symbol, account.deviceState),
    );

    dispatch(cache());
    dispatch({
        type: SEND.SET_TOUCHED,
        touched: false,
    });
};
