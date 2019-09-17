import BigNumber from 'bignumber.js';
import { SEND } from '@wallet-actions/constants';
import { State as ReducerState } from '@wallet-reducers/sendFormReducer';
import { getFiatValue } from '@wallet-utils/accountUtils';
import { Dispatch, GetState } from '@suite-types';
import { Account } from '@wallet-types';

export type SendFormActions =
    | {
          type: typeof SEND.HANDLE_ADDRESS_CHANGE;
          address: string;
          symbol: Account['symbol'];
      }
    | { type: typeof SEND.HANDLE_AMOUNT_CHANGE; amount: string; availableBalance: string }
    | { type: typeof SEND.SET_MAX }
    | { type: typeof SEND.HANDLE_FIAT_VALUE_CHANGE; fiatValue: null | string }
    | {
          type: typeof SEND.HANDLE_SELECT_CURRENCY_CHANGE;
          localCurrency: ReducerState['localCurrency'];
      }
    | { type: typeof SEND.SET_ADDITIONAL_FORM_VISIBILITY }
    | { type: typeof SEND.CLEAR };

/*
    Change value in input "Address"
 */
const handleAddressChange = (address: string) => (dispatch: Dispatch, getState: GetState) => {
    const { account } = getState().wallet.selectedAccount;
    if (!account) return null;

    dispatch({
        type: SEND.HANDLE_ADDRESS_CHANGE,
        address,
        symbol: account.symbol,
    });
};

/*
    Change value in input "Amount"
 */
const handleAmountChange = (amount: string) => (dispatch: Dispatch, getState: GetState) => {
    const { account } = getState().wallet.selectedAccount;
    const { send, fiat } = getState().wallet;
    if (!account || !send || !fiat) return null;

    const fiatNetwork = fiat.find(item => item.symbol === account.symbol);

    if (fiatNetwork) {
        const rate = fiatNetwork.rates[send.localCurrency.value].toString();
        const fiatValue = getFiatValue(amount, rate);
        if (rate) {
            dispatch({
                type: SEND.HANDLE_FIAT_VALUE_CHANGE,
                fiatValue,
            });
        }
    }

    dispatch({
        type: SEND.HANDLE_AMOUNT_CHANGE,
        amount,
        availableBalance: account.availableBalance,
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
    const { fiat, send } = getState().wallet;
    if (!account || !fiat || !send || !send.amount) return null;

    const fiatNetwork = fiat.find(item => item.symbol === account.symbol);
    if (!fiatNetwork) return null;

    const rate = fiatNetwork.rates[localCurrency.value];
    const fiatValueBigNumber = new BigNumber(send.amount).multipliedBy(new BigNumber(rate));
    const fiatValue = fiatValueBigNumber.isNaN() ? '' : fiatValueBigNumber.toFixed(2);
    const amountBigNumber = fiatValueBigNumber.dividedBy(new BigNumber(rate));

    dispatch({
        type: SEND.HANDLE_SELECT_CURRENCY_CHANGE,
        localCurrency,
    });

    dispatch({
        type: SEND.HANDLE_FIAT_VALUE_CHANGE,
        fiatValue,
    });

    dispatch({
        type: SEND.HANDLE_AMOUNT_CHANGE,
        amount: amountBigNumber.isZero() ? '0' : amountBigNumber.toFixed(20),
        availableBalance: account.availableBalance,
    });
};

/*
    Change value in input "FiatInput"
 */
const handleFiatInputChange = (fiatValue: null | string) => (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { account } = getState().wallet.selectedAccount;
    const { fiat, send } = getState().wallet;

    if (!account || !fiat || !send) return null;

    const fiatNetwork = fiat.find(item => item.symbol === account.symbol);
    if (!fiatNetwork) return null;

    const rate = fiatNetwork.rates[send.localCurrency.value];
    const amountBigNumber = new BigNumber(fiatValue || '0').dividedBy(new BigNumber(rate));
    const amount = amountBigNumber.isNaN() ? '' : amountBigNumber.toFixed(20);

    dispatch({
        type: SEND.HANDLE_FIAT_VALUE_CHANGE,
        fiatValue,
    });

    dispatch({
        type: SEND.HANDLE_AMOUNT_CHANGE,
        amount,
        availableBalance: account.availableBalance,
    });
};

/*
    Click on "set max"
 */
const setMax = () => (dispatch: Dispatch, getState: GetState) => {
    const { account } = getState().wallet.selectedAccount;
    const { fiat, send } = getState().wallet;

    if (!account || !fiat || !send) return null;

    const fiatNetwork = fiat.find(item => item.symbol === account.symbol);
    if (!fiatNetwork) return null;

    const rate = fiatNetwork.rates[send.localCurrency.value].toString();
    const fiatValue = getFiatValue(account.availableBalance, rate);

    dispatch({
        type: SEND.HANDLE_FIAT_VALUE_CHANGE,
        fiatValue,
    });

    dispatch({
        type: SEND.HANDLE_AMOUNT_CHANGE,
        amount: account.availableBalance,
        availableBalance: account.availableBalance,
    });
};

/*
    Change value in select "Fee"
 */
const handleFeeValueChange = (val: any) => () => {
    console.log(val);
};

const toggleAdditionalFormVisibility = () => (dispatch: Dispatch) => {
    dispatch({ type: SEND.SET_ADDITIONAL_FORM_VISIBILITY });
};

/*
    Clear to default state
*/
const clear = () => (dispatch: Dispatch) => {
    dispatch({ type: SEND.CLEAR });
};

export {
    handleAddressChange,
    handleAmountChange,
    setMax,
    handleFiatInputChange,
    handleSelectCurrencyChange,
    handleFeeValueChange,
    toggleAdditionalFormVisibility,
    clear,
};
