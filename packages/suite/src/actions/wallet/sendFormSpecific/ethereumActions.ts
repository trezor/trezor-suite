import { SEND } from '@wallet-actions/constants';
import { Dispatch } from '@suite-types';

/*
    Compose transaction
 */
export const compose = () => async (dispatch: Dispatch) => {
    console.log('compose ethereum');
    dispatch({ type: SEND.COMPOSE_PROGRESS, isComposing: false });
};

/*
    Sign transaction
 */
export const send = () => async () => {
    console.log('send');
};

/*
    Change value in input "gas price"
 */
export const handleGasPrice = (gasPrice: string) => (dispatch: Dispatch) => {
    dispatch({
        type: SEND.ETH_HANDLE_GAS_PRICE,
        gasPrice,
    });
};

/*
    Change value in input "gas limit "
 */
export const handleGasLimit = (gasLimit: string) => (dispatch: Dispatch) => {
    dispatch({
        type: SEND.ETH_HANDLE_GAS_LIMIT,
        gasLimit,
    });
};
