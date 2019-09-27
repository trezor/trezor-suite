import { State as SendFormState } from '@wallet-types/sendForm';
import { SEND_CACHE } from '@wallet-actions/constants';
import { Dispatch } from '@suite-types';

export type SendFormCacheActions =
    | { type: typeof SEND_CACHE.ADD; id: string; sendFormState: SendFormState }
    | { type: typeof SEND_CACHE.REMOVE; id: string }
    | { type: typeof SEND_CACHE.CLEAR };

export const cache = (id: string, sendFormState: SendFormState) => (dispatch: Dispatch) => {
    dispatch({ type: SEND_CACHE.ADD, id, sendFormState });
};

export const remove = (id: string) => (dispatch: Dispatch) => {
    dispatch({ type: SEND_CACHE.REMOVE, id });
};

export const clear = () => (dispatch: Dispatch) => {
    dispatch({ type: SEND_CACHE.CLEAR });
};
