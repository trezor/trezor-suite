import { Dispatch, GetState } from '@suite-types';
import { SEND } from '@wallet-actions/constants';
import { ETH_DEFAULT_GAS_LIMIT, ETH_DEFAULT_GAS_PRICE } from '@wallet-constants/sendForm';
import { FeeLevel, Output } from '@wallet-types/sendForm';
import { formatNetworkAmount, getFiatValue } from '@wallet-utils/accountUtils';
import { ParsedURI } from '@wallet-utils/cryptoUriParser';
import {
    getFeeLevels,
    getOutput,
    getReserveInXrp,
    hasDecimals,
    shouldComposeBy,
} from '@wallet-utils/sendFormUtils';
import { getLocalCurrency } from '@wallet-utils/settingsUtils';
import { isAddressValid } from '@wallet-utils/validation';
import BigNumber from 'bignumber.js';
import { isEqual } from 'lodash';

import * as bitcoinActions from './sendFormBitcoinActions';
import * as commonActions from './sendFormCommonActions';
import * as ethereumActions from './sendFormEthereumActions';
import * as rippleActions from './sendFormRippleActions';

/**
 * Initialize current form, load values from session storage
 */
export const init = () => async (dispatch: Dispatch, getState: GetState) => {
    const { settings, selectedAccount } = getState().wallet;
    if (selectedAccount.status !== 'loaded') return null;
    const { account } = selectedAccount;
    const feeInfo = getState().wallet.fees[account.symbol];
    const levels = getFeeLevels(account, feeInfo);
    const firstFeeLevel = levels.find(l => l.label === 'normal') || levels[0];
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
    const { selectedAccount } = getState().wallet;
    if (selectedAccount.status !== 'loaded') return null;
    const { account } = selectedAccount;
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
        if (shouldComposeBy(composeBy, send.outputs, account.networkType)) {
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
    const { send, selectedAccount } = getState().wallet;
    if (!send || selectedAccount.status !== 'loaded') return null;
    const { account } = selectedAccount;
    const { networkType } = account;
    const output = getOutput(send.outputs, outputId);

    dispatch({
        type: SEND.HANDLE_ADDRESS_CHANGE,
        outputId,
        address,
        symbol: account.symbol,
        networkType,
        currentAccountAddress: account.descriptor,
    });

    if (networkType === 'ripple' && isAddressValid(address, account.symbol)) {
        dispatch(rippleActions.checkAccountReserve(output.id, address));
    }

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

    dispatch({
        type: SEND.CHANGE_SET_MAX_STATE,
        activated: false,
    });

    const output = getOutput(send.outputs, outputId);
    const fiatNetwork = fiat.find(item => item.symbol === account.symbol);
    const isValidAmount = hasDecimals(amount, network.decimals);
    const { isDestinationAccountEmpty } = send.networkTypeRipple;
    const reserve = getReserveInXrp(account);
    const { availableBalance, symbol } = account;
    const { decimals } = network;

    if (fiatNetwork && isValidAmount) {
        const rate = fiatNetwork.current?.rates[output.localCurrency.value.value];
        if (rate) {
            const fiatValue = getFiatValue(amount, rate.toString());
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
        symbol,
        decimals,
        availableBalance,
        isDestinationAccountEmpty,
        reserve,
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
    const { availableBalance, symbol } = account;

    const output = getOutput(send.outputs, outputId);
    const fiatNetwork = fiat.find(item => item.symbol === account.symbol);
    const { isDestinationAccountEmpty } = send.networkTypeRipple;
    const reserve = getReserveInXrp(account);

    if (fiatNetwork && output.amount.value) {
        const rate = fiatNetwork.current?.rates[localCurrency.value];
        if (rate) {
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
                symbol,
                amount: amountBigNumber.toString(),
                decimals: network.decimals,
                availableBalance,
                isDestinationAccountEmpty,
                reserve,
            });
        }
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
    const { isDestinationAccountEmpty } = send.networkTypeRipple;
    const { symbol, availableBalance } = account;
    const output = getOutput(send.outputs, outputId);
    const fiatNetwork = fiat.find(item => item.symbol === account.symbol);
    if (!fiatNetwork) return null;
    const rate = fiatNetwork.current?.rates[output.localCurrency.value.value];
    const reserve = getReserveInXrp(account);
    if (!rate) return null;
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
        symbol,
        availableBalance,
        isDestinationAccountEmpty,
        reserve,
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
    const { isDestinationAccountEmpty } = send.networkTypeRipple;
    const reserve = getReserveInXrp(account);

    dispatch({
        type: SEND.CHANGE_SET_MAX_STATE,
        activated: true,
    });

    if (fiatNetwork && composedTransaction && composedTransaction.type !== 'error') {
        const rate = fiatNetwork.current?.rates[output.localCurrency.value.value];
        if (rate) {
            const fiatValue = getFiatValue(
                formatNetworkAmount(composedTransaction.max, account.symbol),
                rate.toString(),
            );
            dispatch({
                type: SEND.HANDLE_FIAT_VALUE_CHANGE,
                outputId,
                fiatValue,
            });
        }
    }

    if (composedTransaction && composedTransaction.type !== 'error') {
        const maxBig = new BigNumber(formatNetworkAmount(composedTransaction.max, account.symbol));
        dispatch({
            type: SEND.HANDLE_AMOUNT_CHANGE,
            outputId,
            symbol: account.symbol,
            amount: maxBig.isLessThanOrEqualTo(0) ? '0' : maxBig.toFixed(network.decimals), // TODO: why is this here? shoudnt formatNetworkAmount do the job?
            decimals: network.decimals,
            availableBalance: account.availableBalance,
            isDestinationAccountEmpty,
            reserve,
        });
    } else {
        dispatch({
            type: SEND.HANDLE_AMOUNT_CHANGE,
            outputId,
            amount: '0',
            symbol: account.symbol,
            decimals: network.decimals,
            availableBalance: account.availableBalance,
            isDestinationAccountEmpty,
            reserve,
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
        dispatch({
            type: SEND.HANDLE_CUSTOM_FEE_VALUE_CHANGE,
            customFee: null,
        });
    }

    dispatch({ type: SEND.HANDLE_FEE_VALUE_CHANGE, fee });

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
    const { send, selectedAccount } = getState().wallet;
    if (!send || selectedAccount.status !== 'loaded') return;

    dispatch({ type: SEND.SET_ADDITIONAL_FORM_VISIBILITY });
    dispatch(commonActions.cache(false));
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
};

export const updateFeeOrNotify = () => (dispatch: Dispatch, getState: GetState) => {
    const { selectedAccount, send } = getState().wallet;
    if (selectedAccount.status !== 'loaded' || !send) return null;
    const { account } = selectedAccount;
    const updatedFeeInfo = getState().wallet.fees[account.symbol];
    const updatedLevels = getFeeLevels(account, updatedFeeInfo);
    const { selectedFee, feeInfo } = send;
    const { levels } = feeInfo;
    const updatedSelectedFee = updatedLevels.find(level => level.label === selectedFee.label);

    const shouldUpdate = !isEqual(levels, updatedLevels);
    if (!shouldUpdate) return null;

    if (selectedFee.label === 'custom') {
        dispatch({
            type: SEND.CHANGE_FEE_STATE,
            feeOutdated: true,
        });
    } else {
        if (!updatedSelectedFee) return null;

        let ethFees = {};
        if (account.networkType === 'ethereum') {
            ethFees = {
                gasPrice: updatedSelectedFee.feePerUnit,
                gasLimit: updatedSelectedFee.feeLimit,
            };
        }

        dispatch({
            type: SEND.UPDATE_FEE,
            feeInfo: {
                ...updatedFeeInfo,
                levels: updatedLevels,
            },
            selectedFee: updatedSelectedFee,
            ...ethFees,
        });
    }
};

export const manuallyUpdateFee = () => (dispatch: Dispatch, getState: GetState) => {
    const { selectedAccount, send } = getState().wallet;
    if (selectedAccount.status !== 'loaded' || !send) return null;
    const { account } = selectedAccount;
    const updatedFeeInfo = getState().wallet.fees[account.symbol];
    const updatedLevels = getFeeLevels(account, updatedFeeInfo);
    const updatedSelectedFee = updatedLevels.find(level => level.label === 'normal');

    if (!updatedSelectedFee) return null;

    let ethFees = {};
    if (account.networkType === 'ethereum') {
        ethFees = {
            gasPrice: updatedSelectedFee.feePerUnit,
            gasLimit: updatedSelectedFee.feeLimit,
        };
    }

    dispatch({
        type: SEND.UPDATE_FEE,
        feeInfo: {
            ...updatedFeeInfo,
            levels: updatedLevels,
        },
        selectedFee: updatedSelectedFee || updatedLevels[0],
        ...ethFees,
    });

    dispatch({
        type: SEND.CHANGE_FEE_STATE,
        feeOutdated: false,
    });
};
