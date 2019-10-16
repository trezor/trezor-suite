import BigNumber from 'bignumber.js';
import { SEND } from '@wallet-actions/constants';
import { getOutput } from '@wallet-utils/sendFormUtils';
import {
    formatNetworkAmount,
    getFiatValue,
    getNetworkAmount,
    getAccountKey,
} from '@wallet-utils/accountUtils';
import { Output, InitialState, FeeLevel } from '@wallet-types/sendForm';
import { ParsedURI } from '@wallet-utils/cryptoUriParser';
import { getLocalCurrency } from '@wallet-utils/settingsUtils';
import { Account } from '@wallet-types';
import { Dispatch, GetState } from '@suite-types';
import * as bitcoinActions from './sendFormSpecific/bitcoinActions';
import * as sendFormCacheActions from './sendFormCacheActions';

export type SendFormActions =
    | {
          type: typeof SEND.HANDLE_ADDRESS_CHANGE;
          outputId: number;
          address: string;
          symbol: Account['symbol'];
      }
    | { type: typeof SEND.HANDLE_AMOUNT_CHANGE; outputId: number; amount: string }
    | { type: typeof SEND.SET_MAX; outputId: number }
    | { type: typeof SEND.COMPOSE_PROGRESS; isComposing: boolean }
    | { type: typeof SEND.HANDLE_FIAT_VALUE_CHANGE; outputId: number; fiatValue: string }
    | { type: typeof SEND.HANDLE_FEE_VALUE_CHANGE; fee: FeeLevel }
    | { type: typeof SEND.HANDLE_CUSTOM_FEE_VALUE_CHANGE; customFee: string | null }
    | {
          type: typeof SEND.HANDLE_SELECT_CURRENCY_CHANGE;
          outputId: number;
          localCurrency: Output['localCurrency']['value'];
      }
    | { type: typeof SEND.SET_ADDITIONAL_FORM_VISIBILITY }
    | { type: typeof SEND.CLEAR; localCurrency: Output['localCurrency']['value'] }
    | { type: typeof SEND.BTC_DELETE_TRANSACTION_INFO }
    | {
          type: typeof SEND.INIT;
          payload: InitialState;
          localCurrency: Output['localCurrency']['value'];
      }
    | { type: typeof SEND.DISPOSE };

/**
 * Initialize current form, load values from session storage
 */
export const init = () => (dispatch: Dispatch, getState: GetState) => {
    const { router } = getState();
    const { settings } = getState().wallet;
    const { account } = getState().wallet.selectedAccount;
    const { sendCache } = getState().wallet;
    if (router.app !== 'wallet' || !router.params) return;

    let cachedState = null;
    const feeInfo = getState().wallet.fees[router.params.symbol];
    const levels: FeeLevel[] = feeInfo.levels.concat({
        label: 'custom',
        feePerUnit: '0',
        value: '0',
        blocks: 0,
    });

    if (account) {
        const accountKey = getAccountKey(account.descriptor, account.symbol, account.deviceState);
        const cachedItem = sendCache.cache.find(item => item.id === accountKey);
        cachedState = cachedItem ? cachedItem.sendFormState : null;
    }

    const localCurrency = getLocalCurrency(settings.localCurrency);

    dispatch({
        type: SEND.INIT,
        payload: {
            feeInfo: {
                ...feeInfo,
                levels,
            },
            selectedFee: levels.find(l => l.label === 'normal') || levels[0],
            ...cachedState,
        },
        localCurrency,
    });
};

export const compose = (setMax: boolean = false) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    dispatch({ type: SEND.COMPOSE_PROGRESS, isComposing: true });
    const account = getState().wallet.selectedAccount.account as Account;
    if (account.networkType === 'bitcoin') {
        dispatch({ type: SEND.BTC_DELETE_TRANSACTION_INFO });
        return dispatch(bitcoinActions.compose(setMax));
    }
};

/*
    Change value in input "Address"
 */
export const handleAddressChange = (outputId: number, address: string) => (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { account } = getState().wallet.selectedAccount;
    const { send } = getState().wallet;
    if (!account || !send) return null;

    dispatch({
        type: SEND.HANDLE_ADDRESS_CHANGE,
        outputId,
        address,
        symbol: account.symbol,
    });

    dispatch(compose());
    dispatch(sendFormCacheActions.cache());
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
        amount: getNetworkAmount(amount, account.symbol),
    });
    dispatch(compose());
    dispatch(sendFormCacheActions.cache());
};

/*
    Change value in select "LocalCurrency"
 */
export const handleSelectCurrencyChange = (
    localCurrency: Output['localCurrency']['value'],
    outputId: number,
) => (dispatch: Dispatch, getState: GetState) => {
    const { account } = getState().wallet.selectedAccount;
    const { fiat, send } = getState().wallet;
    if (!account || !fiat || !send) return null;

    const output = getOutput(send.outputs, outputId);
    const fiatNetwork = fiat.find(item => item.symbol === account.symbol);

    if (fiatNetwork && output.amount.value) {
        const rate = fiatNetwork.rates[localCurrency.value];
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
            amount: getNetworkAmount(amountBigNumber.toString(), account.symbol),
        });
    }

    dispatch({
        type: SEND.HANDLE_SELECT_CURRENCY_CHANGE,
        outputId,
        localCurrency,
    });

    dispatch(compose());
    dispatch(sendFormCacheActions.cache());
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
        amount: getNetworkAmount(amount, account.symbol),
    });

    dispatch(compose());
    dispatch(sendFormCacheActions.cache());
};

/*
    Click on "set max"
 */
export const setMax = (outputId: number) => async (dispatch: Dispatch, getState: GetState) => {
    const { account } = getState().wallet.selectedAccount;
    const { fiat, send } = getState().wallet;

    if (!account || !fiat || !send) return null;

    const composedTransaction = await dispatch(compose(true));
    const output = getOutput(send.outputs, outputId);
    const fiatNetwork = fiat.find(item => item.symbol === account.symbol);

    if (fiatNetwork) {
        const rate = fiatNetwork.rates[output.localCurrency.value.value].toString();
        const fiatValue = getFiatValue(account.availableBalance, rate);
        dispatch({
            type: SEND.HANDLE_FIAT_VALUE_CHANGE,
            outputId,
            fiatValue,
        });
    }

    if (composedTransaction && composedTransaction.type !== 'error') {
        const availableBalanceBig = new BigNumber(account.availableBalance);

        dispatch({
            type: SEND.HANDLE_AMOUNT_CHANGE,
            outputId,
            amount: formatNetworkAmount(
                availableBalanceBig.minus(composedTransaction.fee).toString(),
                account.symbol,
            ),
        });

        dispatch(sendFormCacheActions.cache());
    }
};

/*
    Change value in select "Fee"
 */
export const handleFeeValueChange = (fee: FeeLevel) => (dispatch: Dispatch, getState: GetState) => {
    const { send } = getState().wallet;
    const { account } = getState().wallet.selectedAccount;
    if (!send || !account) return;
    if (send.selectedFee.label === fee.label) return;

    dispatch({ type: SEND.HANDLE_FEE_VALUE_CHANGE, fee });

    if (fee.label === 'custom') {
        dispatch({
            type: SEND.HANDLE_CUSTOM_FEE_VALUE_CHANGE,
            customFee: send.selectedFee.feePerUnit,
        });
        if (!send.isAdditionalFormVisible) {
            dispatch({ type: SEND.SET_ADDITIONAL_FORM_VISIBILITY });
        }
    } else {
        dispatch({
            type: SEND.HANDLE_CUSTOM_FEE_VALUE_CHANGE,
            customFee: null,
        });
    }

    dispatch(compose());
    dispatch(sendFormCacheActions.cache());
};

/*
    Change value in additional form - select "Fee"
 */
export const handleCustomFeeValueChange = (customFee: string) => (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { send } = getState().wallet;
    const { account } = getState().wallet.selectedAccount;
    if (!account || !send) return null;
    const fee = send.feeInfo.levels[send.feeInfo.levels.length - 1];

    dispatch({
        type: SEND.HANDLE_CUSTOM_FEE_VALUE_CHANGE,
        customFee,
    });

    dispatch({
        type: SEND.HANDLE_FEE_VALUE_CHANGE,
        fee: {
            ...fee,
            feePerUnit: customFee,
            value: customFee,
        },
    });

    dispatch(compose());
    dispatch(sendFormCacheActions.cache());
};

/*
    Click on button "Advanced settings"
 */
export const toggleAdditionalFormVisibility = () => (dispatch: Dispatch, getState: GetState) => {
    const { send } = getState().wallet;
    const { account } = getState().wallet.selectedAccount;
    if (!send || !account) return;

    dispatch({ type: SEND.SET_ADDITIONAL_FORM_VISIBILITY });
    dispatch(sendFormCacheActions.cache());
};

/*
    Clear to default state
*/
export const clear = () => (dispatch: Dispatch, getState: GetState) => {
    const { send, settings } = getState().wallet;
    const { account } = getState().wallet.selectedAccount;
    if (!send || !account) return;

    const localCurrency = getLocalCurrency(settings.localCurrency);

    dispatch({ type: SEND.CLEAR, localCurrency });
    dispatch(sendFormCacheActions.cache());
};

export const dispose = () => (dispatch: Dispatch, _getState: GetState) => {
    dispatch({
        type: SEND.DISPOSE,
    });
};

/*
    Fill the address/amount inputs with data from QR code
*/
export const onQrScan = (parsedUri: ParsedURI, outputId: number) => (dispatch: Dispatch) => {
    const { address = '', amount } = parsedUri;
    dispatch(handleAddressChange(outputId, address));
    if (amount) dispatch(handleAmountChange(outputId, amount));
};
