import BigNumber from 'bignumber.js';
import { SEND } from '@wallet-actions/constants';
import { State as ReducerState } from '@wallet-reducers/sendFormReducer';
import { Dispatch, GetState } from '@suite-types';
import { Account } from '@wallet-types';

export type SendFormActions =
    | { type: typeof SEND.SET_ADDITIONAL_FORM_VISIBILITY }
    | { type: typeof SEND.CLEAR }
    | { type: typeof SEND.HANDLE_AMOUNT_CHANGE; amount: string }
    | {
          type: typeof SEND.HANDLE_SELECT_CURRENCY_CHANGE;
          localCurrency: ReducerState['localCurrency'];
      }
    | { type: typeof SEND.HANDLE_FIAT_VALUE_CHANGE; fiatValue: null | string }
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
    const fiatValueBigNumber = new BigNumber(amount).multipliedBy(new BigNumber(rate));
    const fiatValue = fiatValueBigNumber.isNaN() ? '' : fiatValueBigNumber.toFixed(2);

    dispatch({
        type: SEND.HANDLE_FIAT_VALUE_CHANGE,
        fiatValue,
    });

    dispatch({
        type: SEND.HANDLE_AMOUNT_CHANGE,
        amount,
        networkType: account.networkType,
    });
};

/*
    Change value in select "LocalCurrency"
 */
const handleSelectCurrencyChange = (localCurrency: ReducerState['localCurrency']) => (
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
const handleFiatInputChange = (fiatValue: null | string) => (
    dispatch: Dispatch,
    getState: GetState,
) => {
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
