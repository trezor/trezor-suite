import { State as SendFormState } from '@wallet-types/sendForm';
import { SEND_CACHE } from '@wallet-actions/constants';
import { getAccountKey } from '@wallet-utils/accountUtils';
import { Dispatch, GetState } from '@suite-types';

export type SendFormCacheActions =
    | { type: typeof SEND_CACHE.ADD; id: string; sendFormState: SendFormState }
    | { type: typeof SEND_CACHE.REMOVE; id: string }
    | { type: typeof SEND_CACHE.CLEAR };

export const cache = () => (dispatch: Dispatch, getState: GetState) => {
    const { account } = getState().wallet.selectedAccount;
    const { send } = getState().wallet;
    if (!account || !send) return null;

    const id = getAccountKey(account.descriptor, account.symbol, account.deviceState);
    const sendFormState = send;

    dispatch({ type: SEND_CACHE.ADD, id, sendFormState });
};

export const remove = (id: string) => (dispatch: Dispatch) => {
    dispatch({ type: SEND_CACHE.REMOVE, id });
};

export const clear = () => (dispatch: Dispatch) => {
    dispatch({ type: SEND_CACHE.CLEAR });
};
