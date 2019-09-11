import { SEND } from '@wallet-actions/constants';
import { Dispatch, GetState } from '@suite-types';
import { Account } from '@wallet-types';

interface LocalCurrency {
    value: string;
    label: string;
}

export type SendFormActions =
    | { type: typeof SEND.SET_ADDITIONAL_FORM_VISIBILITY }
    | { type: typeof SEND.CLEAR }
    | { type: typeof SEND.HANDLE_AMOUNT_CHANGE; amount: string }
    | { type: typeof SEND.HANDLE_SELECT_CURRENCY_CHANGE; localCurrency: LocalCurrency }
    | { type: typeof SEND.HANDLE_FIAT_VALUE_CHANGE; fiatValue: string }
    | {
          type: typeof SEND.HANDLE_ADDRESS_CHANGE;
          address: string;
          networkType: Account['networkType'];
      };

/*
    Show and hide addition send form - extra coin properties
*/
const toggleAdditionalFormVisibility = () => (dispatch: Dispatch) => {
    dispatch({ type: SEND.SET_ADDITIONAL_FORM_VISIBILITY });
};

/* 
    Reset input values to default state
*/
const clear = () => (dispatch: Dispatch) => {
    dispatch({
        type: SEND.CLEAR,
    });
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
    const { send, fiat } = getState().wallet;

    if (!account || !send || !fiat) return null;

    const fiatNetwork = fiat.find(item => item.symbol === account.symbol);
    if (!fiatNetwork) return null;

    const rate = fiatNetwork.rates[send.localCurrency.value];

    dispatch({
        type: SEND.HANDLE_AMOUNT_CHANGE,
        amount,
        networkType: account.networkType,
    });

    dispatch({
        type: SEND.HANDLE_FIAT_VALUE_CHANGE,
        fiatValue: parseInt(amount, 10) * rate,
    });
};

/*
    Change value in select "LocalCurrency"
 */
const handleSelectCurrencyChange = (localCurrency: LocalCurrency) => (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { account } = getState().wallet.selectedAccount;
    if (account) {
        dispatch({
            type: SEND.HANDLE_SELECT_CURRENCY_CHANGE,
            localCurrency,
            networkType: account.networkType,
        });
    }
};

/*
    Change value in input "FiatInput"
 */
const handleFiatInputChange = (fiatValue: string) => (dispatch: Dispatch, getState: GetState) => {
    const { account } = getState().wallet.selectedAccount;
    if (account) {
        dispatch({
            type: SEND.HANDLE_FIAT_VALUE_CHANGE,
            fiatValue,
        });
    }
};

export {
    toggleAdditionalFormVisibility,
    clear,
    handleAddressChange,
    handleAmountChange,
    handleFiatInputChange,
    handleSelectCurrencyChange,
};
