import BigNumber from 'bignumber.js';
import { SEND } from '@wallet-actions/constants';
import { CUSTOM_FEE } from '@wallet-constants/sendForm';
import { getOutput } from '@wallet-utils/sendFormUtils';
import { FeeItem } from '@wallet-reducers/feesReducer';
import { Output } from '@wallet-types/sendForm';
import { getFiatValue } from '@wallet-utils/accountUtils';
import { Account } from '@wallet-types';
import { Dispatch, GetState } from '@suite-types';

export type SendFormActions =
    | {
          type: typeof SEND.HANDLE_ADDRESS_CHANGE;
          outputId: number;
          address: string;
          symbol: Account['symbol'];
      }
    | {
          type: typeof SEND.HANDLE_AMOUNT_CHANGE;
          outputId: number;
          amount: string;
          availableBalance: string;
      }
    | {
          type: typeof SEND.SET_MAX;
          outputId: number;
      }
    | {
          type: typeof SEND.HANDLE_FIAT_VALUE_CHANGE;
          outputId: number;
          fiatValue: string;
      }
    | {
          type: typeof SEND.HANDLE_FEE_VALUE_CHANGE;
          fee: FeeItem;
      }
    | {
          type: typeof SEND.HANDLE_CUSTOM_FEE_VALUE_CHANGE;
          customFee: string;
      }
    | {
          type: typeof SEND.HANDLE_SELECT_CURRENCY_CHANGE;
          outputId: number;
          localCurrency: Output['localCurrency']['value'];
      }
    | {
          type: typeof SEND.SET_ADDITIONAL_FORM_VISIBILITY;
      }
    | {
          type: typeof SEND.CLEAR;
      };

/**
 * Initialize current form, load values from session storage
 */
export const init = () => (_dispatch: Dispatch, _getState: GetState) => {};

/**
 * Dispose current form, save values to session storage
 */
export const dispose = () => (_dispatch: Dispatch, _getState: GetState) => {};

/**
 * Initialize current form, load values from session storage
 */
export const init = () => (_dispatch: Dispatch, _getState: GetState) => {};

/**
 * Dispose current form, save values to session storage
 */
export const dispose = () => (_dispatch: Dispatch, _getState: GetState) => {};

/*
    Change value in input "Address"
 */
export const handleAddressChange = (outputId: number, address: string) => (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { account } = getState().wallet.selectedAccount;
    if (!account) return null;

    dispatch({
        type: SEND.HANDLE_ADDRESS_CHANGE,
        outputId,
        address,
        symbol: account.symbol,
    });
};

/*
    Change value in input "Amount"
 */
export const handleAmountChange = (outputId: number, amount: string) => (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { account } = getState().wallet.selectedAccount;
    const { send, fiat } = getState().wallet;
    if (!account || !send || !fiat) return null;

    const output = getOutput(send.outputs, outputId);
    const fiatNetwork = fiat.find(item => item.symbol === account.symbol);

    if (fiatNetwork) {
        const rate = fiatNetwork.rates[output.localCurrency.value.value].toString();
        const fiatValue = getFiatValue(amount, rate);
        if (rate) {
            dispatch({
                type: SEND.HANDLE_FIAT_VALUE_CHANGE,
                outputId,
                fiatValue,
            });
        }
    }

    dispatch({
        type: SEND.HANDLE_AMOUNT_CHANGE,
        outputId,
        amount,
        availableBalance: account.availableBalance,
    });
};

/*
    Change value in select "LocalCurrency"
 */
export const handleSelectCurrencyChange = (
    localCurrency: Output['localCurrency'],
    outputId: number,
) => (dispatch: Dispatch, getState: GetState) => {
    const { account } = getState().wallet.selectedAccount;
    const { fiat, send } = getState().wallet;
    if (!account || !fiat || !send) return null;

    const output = getOutput(send.outputs, outputId);
    const fiatNetwork = fiat.find(item => item.symbol === account.symbol);

    if (fiatNetwork && output.amount.value) {
        const rate = fiatNetwork.rates[localCurrency.value.value];
        const fiatValueBigNumber = new BigNumber(output.amount.value).multipliedBy(
            new BigNumber(rate),
        );
        const fiatValue = fiatValueBigNumber.isNaN() ? '' : fiatValueBigNumber.toFixed(2);
        const amountBigNumber = fiatValueBigNumber.dividedBy(new BigNumber(rate));

        dispatch({
            type: SEND.HANDLE_FIAT_VALUE_CHANGE,
            outputId,
            fiatValue,
        });

        dispatch({
            type: SEND.HANDLE_AMOUNT_CHANGE,
            outputId,
            amount: amountBigNumber.isZero() ? '0' : amountBigNumber.toFixed(20),
            availableBalance: account.availableBalance,
        });
    }

    dispatch({
        type: SEND.HANDLE_SELECT_CURRENCY_CHANGE,
        outputId,
        localCurrency: localCurrency.value,
    });
};

/*
    Change value in input "FiatInput"
 */
export const handleFiatInputChange = (outputId: number, fiatValue: string) => (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { account } = getState().wallet.selectedAccount;
    const { fiat, send } = getState().wallet;

    if (!account || !fiat || !send) return null;

    const output = getOutput(send.outputs, outputId);
    const fiatNetwork = fiat.find(item => item.symbol === account.symbol);
    if (!fiatNetwork) return null;

    const rate = fiatNetwork.rates[output.localCurrency.value.value];
    const amountBigNumber = new BigNumber(fiatValue || '0').dividedBy(new BigNumber(rate));
    const amount = amountBigNumber.isNaN() ? '' : amountBigNumber.toFixed(20);

    dispatch({
        type: SEND.HANDLE_FIAT_VALUE_CHANGE,
        outputId,
        fiatValue,
    });

    dispatch({
        type: SEND.HANDLE_AMOUNT_CHANGE,
        outputId,
        amount,
        availableBalance: account.availableBalance,
    });
};

/*
    Click on "set max"
 */
export const setMax = (outputId: number) => (dispatch: Dispatch, getState: GetState) => {
    const { account } = getState().wallet.selectedAccount;
    const { fiat, send } = getState().wallet;

    if (!account || !fiat || !send) return null;
    const output = getOutput(send.outputs, outputId);

    const fiatNetwork = fiat.find(item => item.symbol === account.symbol);
    if (!fiatNetwork) return null;

    const rate = fiatNetwork.rates[output.localCurrency.value.value].toString();
    const fiatValue = getFiatValue(account.availableBalance, rate);

    dispatch({
        type: SEND.HANDLE_FIAT_VALUE_CHANGE,
        outputId,
        fiatValue,
    });

    dispatch({
        type: SEND.HANDLE_AMOUNT_CHANGE,
        outputId,
        amount: account.availableBalance,
        availableBalance: account.availableBalance,
    });
};

/*
    Change value in select "Fee"
 */
export const handleFeeValueChange = (fee: any) => (dispatch: Dispatch, getState: GetState) => {
    const { send } = getState().wallet;
    if (!send || !fee) return null;

    dispatch({ type: SEND.HANDLE_FEE_VALUE_CHANGE, fee });

    if (!send.isAdditionalFormVisible && fee.value === CUSTOM_FEE) {
        dispatch({ type: SEND.SET_ADDITIONAL_FORM_VISIBILITY });
    }
};

/*
    Change value in additional form - select "Fee"
 */
export const handleCustomFeeValueChange = (customFee: string) => (dispatch: Dispatch) => {
    dispatch({ type: SEND.HANDLE_CUSTOM_FEE_VALUE_CHANGE, customFee });
    dispatch({ type: SEND.HANDLE_FEE_VALUE_CHANGE, fee: { label: CUSTOM_FEE, value: CUSTOM_FEE } });
};

/*
    Click on button "Advanced settings"
 */
export const toggleAdditionalFormVisibility = () => (dispatch: Dispatch) => {
    dispatch({ type: SEND.SET_ADDITIONAL_FORM_VISIBILITY });
};

/*
    Clear to default state
*/
export const clear = () => (dispatch: Dispatch) => {
    dispatch({ type: SEND.CLEAR });
};
