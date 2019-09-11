import { SEND } from '@wallet-actions/constants';
import { Dispatch, GetState } from '@suite-types';
import { Account } from '@wallet-types';

export type SendFormActions =
    | { type: typeof SEND.SET_ADDITIONAL_FORM_VISIBILITY }
    | { type: typeof SEND.CLEAR }
    | {
          type: typeof SEND.HANDLE_ADDRESS_CHANGE;
          address: string;
          networkType: Account['networkType'];
      }
    | {
          type: typeof SEND.HANDLE_AMOUNT_CHANGE;
          amount: string;
          networkType: Account['networkType'];
      }
    | {
          type: typeof SEND.HANDLE_LOCAL_CURRENCY_CHANGE;
          localCurrency: string;
          networkType: Account['networkType'];
      };

/*
    Show and hide addition send form - extra coin properties
*/
const toggleAdditionalFormVisibility = () => (dispatch: Dispatch) => {
    dispatch({ type: SEND.SET_ADDITIONAL_FORM_VISIBILITY });
};

/* 
    Reset input values to default states
*/
const clear = () => (dispatch: Dispatch) => {
    dispatch({ type: SEND.CLEAR });
};

/*
    Change value in input "Address"
 */
const handleAddressChange = (address: string) => (dispatch: Dispatch, getState: GetState) => {
    const { account } = getState().wallet.selectedAccount;
    if (account) {
        dispatch({
            type: SEND.HANDLE_ADDRESS_CHANGE,
            address,
            networkType: account.networkType,
        });
    }
};

/*
    Change value in input "Amount"
 */
const handleAmountChange = (amount: string) => (dispatch: Dispatch, getState: GetState) => {
    const { account } = getState().wallet.selectedAccount;
    if (account) {
        dispatch({
            type: SEND.HANDLE_AMOUNT_CHANGE,
            amount,
            networkType: account.networkType,
        });
    }
};

/*
    Change value in input "LocalCurrency"
 */
const handleLocalCurrencyChange = (localCurrency: string) => (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { account } = getState().wallet.selectedAccount;
    if (account) {
        dispatch({
            type: SEND.HANDLE_LOCAL_CURRENCY_CHANGE,
            localCurrency,
            networkType: account.networkType,
        });
    }
};

export {
    toggleAdditionalFormVisibility,
    clear,
    handleAddressChange,
    handleAmountChange,
    handleLocalCurrencyChange,
};
