import BigNumber from 'bignumber.js';
import { SEND } from '@wallet-actions/constants';
import { CUSTOM_FEE } from '@wallet-constants/sendForm';
import { State as ReducerState } from '@wallet-reducers/sendFormReducer';
import { FeeItem } from '@wallet-reducers/feesReducer';
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
    | { type: typeof SEND.HANDLE_FIAT_VALUE_CHANGE; fiatValue: string }
    | { type: typeof SEND.HANDLE_FEE_VALUE_CHANGE; fee: FeeItem }
    | { type: typeof SEND.HANDLE_CUSTOM_FEE_VALUE_CHANGE; customFee: string }
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
    if (!account || !fiat || !send) return null;

    const fiatNetwork = fiat.find(item => item.symbol === account.symbol);

    if (fiatNetwork && send.amount) {
        const rate = fiatNetwork.rates[localCurrency.value];
        const fiatValueBigNumber = new BigNumber(send.amount).multipliedBy(new BigNumber(rate));
        const fiatValue = fiatValueBigNumber.isNaN() ? '' : fiatValueBigNumber.toFixed(2);
        const amountBigNumber = fiatValueBigNumber.dividedBy(new BigNumber(rate));

        dispatch({
            type: SEND.HANDLE_FIAT_VALUE_CHANGE,
            fiatValue,
        });

        dispatch({
            type: SEND.HANDLE_AMOUNT_CHANGE,
            amount: amountBigNumber.isZero() ? '0' : amountBigNumber.toFixed(20),
            availableBalance: account.availableBalance,
        });
    }

    dispatch({
        type: SEND.HANDLE_SELECT_CURRENCY_CHANGE,
        localCurrency,
    });
};

/*
    Change value in input "FiatInput"
 */
const handleFiatInputChange = (fiatValue: string) => (dispatch: Dispatch, getState: GetState) => {
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
const handleFeeValueChange = (fee: { value: string; label: string }) => (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { send } = getState().wallet;
    if (!send) return null;

    dispatch({ type: SEND.HANDLE_FEE_VALUE_CHANGE, fee });

    if (!send.isAdditionalFormVisible && fee.value === CUSTOM_FEE) {
        dispatch({ type: SEND.SET_ADDITIONAL_FORM_VISIBILITY });
    }
};

/*
    Change value in additional form - select "Fee"
 */
const handleCustomFeeValueChange = (customFee: string) => (dispatch: Dispatch) => {
    dispatch({ type: SEND.HANDLE_CUSTOM_FEE_VALUE_CHANGE, customFee });
    dispatch({ type: SEND.HANDLE_FEE_VALUE_CHANGE, fee: { label: CUSTOM_FEE, value: CUSTOM_FEE } });
};

/*
    Click on button "Advanced settings"
 */
const toggleAdditionalFormVisibility = () => (dispatch: Dispatch) => {
    dispatch({ type: SEND.SET_ADDITIONAL_FORM_VISIBILITY });
};

/*
    Clear to default state
*/
const clear = () => (dispatch: Dispatch) => {
    dispatch({ type: SEND.CLEAR });
};

/*
    Click on button "Send"
*/
const send = (networkType: Account['networkType']) => () => {
    switch (networkType) {
        case 'bitcoin':
            return console.log('validate and send bitcoin like transaction');
        case 'ethereum':
            return console.log('validate and send ethereum like transaction');
        case 'ripple':
            return console.log('validate and send ripple like transaction');
        // no default
    }
};

export {
    handleAddressChange,
    handleAmountChange,
    setMax,
    handleFiatInputChange,
    handleSelectCurrencyChange,
    handleFeeValueChange,
    handleCustomFeeValueChange,
    toggleAdditionalFormVisibility,
    clear,
    send,
};
