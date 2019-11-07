import { Dispatch, GetState } from '@suite-types';
import { SEND } from '@wallet-actions/constants';
import { Account } from '@wallet-types';
import { FeeLevel, Output } from '@wallet-types/sendForm';
import { formatNetworkAmount, getAccountKey, getFiatValue } from '@wallet-utils/accountUtils';
import { ParsedURI } from '@wallet-utils/cryptoUriParser';
import { getOutput, hasDecimals, shouldComposeBy } from '@wallet-utils/sendFormUtils';
import { getLocalCurrency } from '@wallet-utils/settingsUtils';
import BigNumber from 'bignumber.js';

import * as storageActions from '@suite-actions/storageActions';
import * as bitcoinActions from './sendFormSpecific/bitcoinActions';
// import * as ethereumActions from './sendFormSpecific/ethereumActions';
import * as rippleActions from './sendFormSpecific/rippleActions';

/**
 * Initialize current form, load values from session storage
 */
export const init = () => async (dispatch: Dispatch, getState: GetState) => {
    const { router } = getState();
    const { settings } = getState().wallet;
    const { account } = getState().wallet.selectedAccount;
    if (router.app !== 'wallet' || !router.params || !account) return;

    let cachedState = null;
    const feeInfo = getState().wallet.fees[router.params.symbol];
    const levels: FeeLevel[] = feeInfo.levels.concat({
        label: 'custom',
        feePerUnit: '0',
        value: '0',
        blocks: 0,
    });

    const accountKey = getAccountKey(account.descriptor, account.symbol, account.deviceState);
    const cachedItem = await storageActions.loadSendForm(accountKey);
    cachedState = cachedItem;

    const localCurrency = getLocalCurrency(settings.localCurrency);

    dispatch({
        type: SEND.INIT,
        payload: {
            deviceState: account.deviceState,
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

export const cache = () => async (_dispatch: Dispatch, getState: GetState) => {
    const { account } = getState().wallet.selectedAccount;
    const { send } = getState().wallet;
    if (!account || !send) return null;

    const id = getAccountKey(account.descriptor, account.symbol, account.deviceState);
    const sendFormState = send;
    storageActions.saveSendForm(sendFormState, id);
};

export const compose = (setMax: boolean = false) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    dispatch({ type: SEND.COMPOSE_PROGRESS, isComposing: true });
    const account = getState().wallet.selectedAccount.account as Account;

    switch (account.networkType) {
        case 'bitcoin': {
            return dispatch(bitcoinActions.compose(setMax));
        }
        case 'ripple': {
            return dispatch(rippleActions.compose());
        }
        // case 'ethereum': {
        //     return dispatch(ethereumActions.compose());
        // }
        // no default
    }
};

const applyChange = (composeBy?: 'address' | 'amount') => (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { send } = getState().wallet;
    const { account } = getState().wallet.selectedAccount;
    if (!send || !account) return null;

    dispatch({
        type: SEND.DELETE_TRANSACTION_INFO,
        networkType: account.networkType,
    });

    if (!composeBy) {
        dispatch(compose());
    }

    if (composeBy) {
        if (shouldComposeBy(composeBy, send.outputs)) {
            dispatch(compose());
        }
    }

    dispatch(cache());
};

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
        networkType: account.networkType,
        currentAccountAddress: account.descriptor,
    });

    dispatch(applyChange('address'));
};

/*
    Change value in input "Amount"
 */
export const handleAmountChange = (outputId: number, amount: string) => (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { account, network } = getState().wallet.selectedAccount;
    const { send, fiat } = getState().wallet;
    if (!account || !send || !fiat || !network) return null;

    const output = getOutput(send.outputs, outputId);
    const fiatNetwork = fiat.find(item => item.symbol === account.symbol);
    const isValidAmount = hasDecimals(amount, network.decimals);

    if (fiatNetwork && isValidAmount) {
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
        decimals: network.decimals,
        availableBalance: account.formattedBalance,
    });

    dispatch(applyChange('amount'));
};

/*
    Change value in select "LocalCurrency"
 */
export const handleSelectCurrencyChange = (
    localCurrency: Output['localCurrency']['value'],
    outputId: number,
) => (dispatch: Dispatch, getState: GetState) => {
    const { account, network } = getState().wallet.selectedAccount;
    const { fiat, send } = getState().wallet;
    if (!account || !fiat || !send || !network) return null;

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
            amount: amountBigNumber.toString(),
            decimals: network.decimals,
            availableBalance: account.formattedBalance,
        });
    }

    dispatch({
        type: SEND.HANDLE_SELECT_CURRENCY_CHANGE,
        outputId,
        localCurrency,
    });

    dispatch(applyChange('amount'));
};

/*
    Change value in input "FiatInput"
 */
export const handleFiatInputChange = (outputId: number, fiatValue: string) => (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { account, network } = getState().wallet.selectedAccount;
    const { fiat, send } = getState().wallet;
    if (!account || !fiat || !send || !network) return null;

    const output = getOutput(send.outputs, outputId);
    const fiatNetwork = fiat.find(item => item.symbol === account.symbol);

    if (!fiatNetwork) return null;

    const rate = fiatNetwork.rates[output.localCurrency.value.value];
    const amountBigNumber = new BigNumber(fiatValue || '0').dividedBy(new BigNumber(rate));
    const amount = amountBigNumber.isNaN() ? '' : amountBigNumber.toFixed(network.decimals);

    dispatch({
        type: SEND.HANDLE_FIAT_VALUE_CHANGE,
        outputId,
        fiatValue,
    });

    dispatch({
        type: SEND.HANDLE_AMOUNT_CHANGE,
        outputId,
        amount,
        decimals: network.decimals,
        availableBalance: account.formattedBalance,
    });

    dispatch(applyChange('amount'));
};

/*
    Click on "set max"
 */
export const setMax = (outputId: number) => async (dispatch: Dispatch, getState: GetState) => {
    const { account, network } = getState().wallet.selectedAccount;
    const { fiat, send } = getState().wallet;

    if (!account || !fiat || !send || !network) return null;

    const composedTransaction = await dispatch(compose(true));
    const output = getOutput(send.outputs, outputId);
    const fiatNetwork = fiat.find(item => item.symbol === account.symbol);

    if (fiatNetwork && composedTransaction && composedTransaction.type !== 'error') {
        const rate = fiatNetwork.rates[output.localCurrency.value.value].toString();
        const fiatValue = getFiatValue(
            formatNetworkAmount(composedTransaction.max, account.symbol),
            rate,
        );
        if (rate) {
            dispatch({
                type: SEND.HANDLE_FIAT_VALUE_CHANGE,
                outputId,
                fiatValue,
            });
        }
        dispatch({
            type: SEND.HANDLE_FIAT_VALUE_CHANGE,
            outputId,
            fiatValue,
        });
    }

    if (composedTransaction && composedTransaction.type !== 'error') {
        const availableBalanceBig = new BigNumber(account.availableBalance);

        const amount = formatNetworkAmount(
            availableBalanceBig.minus(composedTransaction.fee).toString(),
            account.symbol,
        );

        const amountBig = new BigNumber(amount);

        dispatch({
            type: SEND.HANDLE_AMOUNT_CHANGE,
            outputId,
            amount: amountBig.isLessThan(0) ? '0' : amountBig.toString(),
            decimals: network.decimals,
            availableBalance: account.availableBalance,
        });
    } else {
        dispatch({
            type: SEND.HANDLE_AMOUNT_CHANGE,
            outputId,
            amount: '0',
            decimals: network.decimals,
            availableBalance: account.availableBalance,
        });
    }

    dispatch(applyChange('amount'));
};

/*
    Change value in select "Fee"
 */
export const handleFeeValueChange = (fee: FeeLevel) => (dispatch: Dispatch, getState: GetState) => {
    const { send } = getState().wallet;
    const { account } = getState().wallet.selectedAccount;
    if (!send || !account) return;
    if (send.selectedFee.label === fee.label) return;

    if (fee.label === 'custom') {
        // show additional form
        if (!send.isAdditionalFormVisible) {
            dispatch({ type: SEND.SET_ADDITIONAL_FORM_VISIBILITY });
        }

        dispatch({
            type: SEND.HANDLE_CUSTOM_FEE_VALUE_CHANGE,
            customFee: send.selectedFee.feePerUnit,
        });
    } else {
        dispatch({ type: SEND.HANDLE_FEE_VALUE_CHANGE, fee });
        dispatch({
            type: SEND.HANDLE_CUSTOM_FEE_VALUE_CHANGE,
            customFee: null,
        });
    }

    dispatch(applyChange());
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

    dispatch(applyChange());
};

/*
    Click on button "Advanced settings"
 */
export const toggleAdditionalFormVisibility = () => (dispatch: Dispatch, getState: GetState) => {
    const { send } = getState().wallet;
    const { account } = getState().wallet.selectedAccount;
    if (!send || !account) return;

    dispatch({ type: SEND.SET_ADDITIONAL_FORM_VISIBILITY });
    dispatch(cache());
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
    // remove sendForm from the DB here or in storageMiddleware on SEND.CLEAR?
    storageActions.removeSendForm(
        getAccountKey(account.descriptor, account.symbol, account.deviceState),
    );
    dispatch(cache());
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
    if (amount) {
        dispatch(handleAmountChange(outputId, amount));
    }
};
