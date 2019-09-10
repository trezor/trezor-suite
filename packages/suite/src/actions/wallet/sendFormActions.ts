import { SEND } from '@wallet-actions/constants';
import { Dispatch, GetState } from '@suite-types';

export type SendFormActions =
    | { type: typeof SEND.SET_ADDITIONAL_FORM_VISIBILITY }
    | { type: typeof SEND.HANDLE_ADDRESS_CHANGE; address: string }
    | { type: typeof SEND.TOUCH }
    | { type: typeof SEND.CLEAR };

/*
    show and hide addition send form - extra coin properties
*/
const toggleAdditionalFormVisibility = () => (dispatch: Dispatch) => {
    dispatch({ type: SEND.SET_ADDITIONAL_FORM_VISIBILITY });
    dispatch({ type: SEND.TOUCH });
};

/* 
    Reset input values to default states
*/
const clear = () => (dispatch: Dispatch) => {
    dispatch({ type: SEND.CLEAR });
};

const handleAddressChange = (address: string) => (dispatch: Dispatch, getState: GetState) => {
    const { account } = getState().wallet.selectedAccount;
    if (account) {
        dispatch({
            type: SEND.HANDLE_ADDRESS_CHANGE,
            address,
            networkType: account.network,
        });
    }
};

export { toggleAdditionalFormVisibility, clear, handleAddressChange };
