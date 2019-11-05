import { SEND } from '@wallet-actions/constants';
import { Dispatch } from '@suite-types';

/*
    Compose transaction
 */
export const compose = () => async (dispatch: Dispatch) => {
    console.log('compose ethereum');
    dispatch({ type: SEND.COMPOSE_PROGRESS, isComposing: false });
};

export const send = () => async () => {
    console.log('send');
};
