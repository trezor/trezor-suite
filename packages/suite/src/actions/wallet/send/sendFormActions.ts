// import * as storageActions from '@suite-actions/storageActions';
import { Dispatch, GetState } from '@suite-types';
import { SEND } from '@wallet-actions/constants';
import { ETH_DEFAULT_GAS_LIMIT, ETH_DEFAULT_GAS_PRICE } from '@wallet-constants/sendForm';
import { Account } from '@wallet-types';
import { FeeLevel, Output } from '@wallet-types/sendForm';
import { formatNetworkAmount, getFiatValue } from '@wallet-utils/accountUtils';
// import { formatNetworkAmount, getAccountKey, getFiatValue } from '@wallet-utils/accountUtils';
import { ParsedURI } from '@wallet-utils/cryptoUriParser';
import { getOutput, hasDecimals, shouldComposeBy } from '@wallet-utils/sendFormUtils';
import { getLocalCurrency } from '@wallet-utils/settingsUtils';
import BigNumber from 'bignumber.js';
// @ts-ignore
import ethUnits from 'ethereumjs-units';

import * as bitcoinActions from './sendFormBitcoinActions';
import * as ethereumActions from './sendFormEthereumActions';
import * as rippleActions from './sendFormRippleActions';
import * as commonActions from './sendFormCommonActions';

/**
 * Initialize current form, load values from session storage
 */
export const init = () => async (dispatch: Dispatch, getState: GetState) => {
    // const { settings, send } = getState().wallet;
    const { settings } = getState().wallet;
    const { account } = getState().wallet.selectedAccount;
    if (!account) return;

    // let cachedState = null;
    const convertedEthLevels: FeeLevel[] = [];
    const feeInfo = getState().wallet.fees[account.symbol];

    const initialLevels: FeeLevel[] =
        account.networkType === 'ethereum'
            ? feeInfo.levels
            : feeInfo.levels.concat({
                  label: 'custom',
                  feePerUnit: '0',
                  blocks: 0,
              });

    if (account.networkType === 'ethereum') {
        initialLevels.forEach(level =>
            convertedEthLevels.push({
                ...level,
                feePerUnit: ethUnits.convert(level.feePerUnit, 'wei', 'gwei'),
            }),
        );
    }

    const levels = account.networkType === 'ethereum' ? convertedEthLevels : initialLevels;
    const firstFeeLevel = levels.find(l => l.label === 'normal') || levels[0];
    // const accountKey = getAccountKey(account.descriptor, account.symbol, account.deviceState);
    // const cachedItem = await storageActions.loadSendForm(accountKey);

    // cachedState = cachedItem;

    const localCurrency = getLocalCurrency(settings.localCurrency);

    dispatch({
        type: SEND.INIT,
        payload: {
            deviceState: account.deviceState,
            feeInfo: {
                ...feeInfo,
                levels,
            },
            networkTypeEthereum: {
                transactionInfo: null,
                gasPrice: {
                    value: firstFeeLevel.feePerUnit || ETH_DEFAULT_GAS_PRICE,
                    error: null,
                },
                gasLimit: {
                    value: firstFeeLevel.feeLimit || ETH_DEFAULT_GAS_LIMIT,
                    error: null,
                },
                data: { value: null, error: null },
            },
            selectedFee: firstFeeLevel,
            // ...cachedState,
        },
        localCurrency,
    });
};

export const compose = (setMax = false) => async (dispatch: Dispatch, getState: GetState) => {
    dispatch({ type: SEND.COMPOSE_PROGRESS, isComposing: true });
    const account = getState().wallet.selectedAccount.account as Account;

    switch (account.networkType) {
        case 'bitcoin': {
            return dispatch(bitcoinActions.compose(setMax));
        }
        case 'ripple': {
            return dispatch(rippleActions.compose());
        }
        case 'ethereum': {
            return dispatch(ethereumActions.compose());
        }
        // no default
    }
};

export const composeChange = (composeBy?: 'address' | 'amount') => (
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

    dispatch(commonActions.cache());
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

    dispatch(composeChange('address'));
};

/*
    Change value in input "Amount"
 */
export const handleAmountChange = (outputId: number, amount: string) => (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { send, fiat, selectedAccount } = getState().wallet;
    if (!send || !fiat || selectedAccount.status !== 'loaded') return null;
    const { account, network } = selectedAccount;

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

    dispatch(composeChange('amount'));
};

/*
    Change value in select "LocalCurrency"
 */
export const handleSelectCurrencyChange = (
    localCurrency: Output['localCurrency']['value'],
    outputId: number,
) => (dispatch: Dispatch, getState: GetState) => {
    const { fiat, send, selectedAccount } = getState().wallet;
    if (!fiat || !send || selectedAccount.status !== 'loaded') return null;
    const { account, network } = selectedAccount;

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

    dispatch(composeChange('amount'));
};

/*
    Change value in input "FiatInput"
 */
export const handleFiatInputChange = (outputId: number, fiatValue: string) => (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { fiat, send, selectedAccount } = getState().wallet;
    if (!fiat || !send || selectedAccount.status !== 'loaded') return null;
    const { account, network } = selectedAccount;

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

    dispatch(composeChange('amount'));
};

/*
    Click on "set max"
 */
export const setMax = (outputId: number) => async (dispatch: Dispatch, getState: GetState) => {
    const { fiat, send, selectedAccount } = getState().wallet;

    if (!fiat || !send || selectedAccount.status !== 'loaded') return null;
    const { account, network } = selectedAccount;
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

    dispatch(composeChange('amount'));
};

/*
    Change value in select "Fee"
 */
export const handleFeeValueChange = (fee: FeeLevel) => (dispatch: Dispatch, getState: GetState) => {
    const { send, selectedAccount } = getState().wallet;
    if (!send || selectedAccount.status !== 'loaded') return;
    const { account } = selectedAccount;
    if (send.selectedFee.label === fee.label) return;

    if (fee.label === 'custom') {
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

    // eth update gas price and gas limit
    if (account.networkType === 'ethereum') {
        dispatch({
            type: SEND.ETH_HANDLE_GAS_LIMIT,
            gasLimit: fee.feeLimit || '0',
        });

        dispatch({
            type: SEND.ETH_HANDLE_GAS_PRICE,
            gasPrice: fee.feePerUnit || '0',
        });
    }

    dispatch(composeChange());
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
        },
    });

    dispatch(composeChange());
};

/*
    Click on button "Advanced settings"
 */
export const toggleAdditionalFormVisibility = () => (dispatch: Dispatch, getState: GetState) => {
    const { send } = getState().wallet;
    const { account } = getState().wallet.selectedAccount;
    if (!send || !account) return;

    dispatch({ type: SEND.SET_ADDITIONAL_FORM_VISIBILITY });
    dispatch(commonActions.cache());
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

/*
    Clear to default state
*/
export const clear = () => (dispatch: Dispatch) => {
    dispatch(commonActions.clear());
    dispatch(init());
};
