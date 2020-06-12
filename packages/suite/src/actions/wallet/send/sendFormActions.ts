import { Dispatch, GetState } from '@suite-types';
import { TokenInfo } from 'trezor-connect';
import { SEND } from '@wallet-actions/constants';
import * as comparisonUtils from '@suite-utils/comparisonUtils';
import { FeeLevel, Output } from '@wallet-types/sendForm';
import { formatNetworkAmount, getFiatValue } from '@wallet-utils/accountUtils';
import { ParsedURI } from '@wallet-utils/cryptoUriParser';
import { getFeeLevels, getOutput, getReserveInXrp, hasDecimals } from '@wallet-utils/sendFormUtils';
import { getLocalCurrency } from '@wallet-utils/settingsUtils';
import { isAddressValid } from '@wallet-utils/validation';
import BigNumber from 'bignumber.js';

import * as bitcoinActions from './sendFormBitcoinActions';
import * as commonActions from './sendFormCommonActions';
import * as ethereumActions from './sendFormEthereumActions';
import * as rippleActions from './sendFormRippleActions';

// common method called from multiple places:
// handleAmountChange, handleFiatSelectChange, handleFiatInputChange, setMax, handleTokenSelectChange
const amountChange = (amountIn?: string, outputIdIn?: number) => (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { send, selectedAccount } = getState().wallet;
    if (!send || selectedAccount.status !== 'loaded') return null;
    const { account, network } = selectedAccount;
    const outputId = outputIdIn || 0;
    const amount = amountIn || send.outputs[outputId].amount.value;
    if (!amount) return; // do not trigger validation inside reducer if until amount is not set
    const { isDestinationAccountEmpty } = send.networkTypeRipple;
    const reserve = getReserveInXrp(account);
    const { token } = send.networkTypeEthereum;
    const availableBalance = token ? token.balance! : account.availableBalance;
    const decimals = token ? token.decimals : network.decimals;

    dispatch({
        type: SEND.HANDLE_AMOUNT_CHANGE,
        outputId,
        symbol: network.symbol,
        amount,
        decimals,
        availableBalance,
        isDestinationAccountEmpty,
        reserve,
    });
};

/*
    Change value in input "Amount"
 */
export const handleAmountChange = (outputId: number, amount: string) => (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { send, selectedAccount } = getState().wallet;
    const fiat = getState().wallet.fiat.coins;
    if (!send || !fiat || selectedAccount.status !== 'loaded') return null;
    const { account, network } = selectedAccount;

    dispatch({
        type: SEND.CHANGE_SET_MAX_STATE,
        activated: false,
    });

    const output = getOutput(send.outputs, outputId);
    const fiatNetwork = fiat.find(item => item.symbol === account.symbol);
    const isValidAmount = hasDecimals(amount, network.decimals);

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

    dispatch(amountChange(amount, outputId));
    dispatch(composeChange('amount', send.setMaxActivated));
};

/*
    Change value in select "LocalCurrency"
 */
export const handleFiatSelectChange = (
    localCurrency: Output['localCurrency']['value'],
    outputId: number,
) => (dispatch: Dispatch, getState: GetState) => {
    const { send, selectedAccount } = getState().wallet;
    const fiat = getState().wallet.fiat.coins;
    if (!fiat || !send || selectedAccount.status !== 'loaded') return null;
    const { account } = selectedAccount;

    const output = getOutput(send.outputs, outputId);
    const fiatNetwork = fiat.find(item => item.symbol === account.symbol);

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

            dispatch(amountChange(amountBigNumber.toString(), outputId));
        }
    }

    dispatch({
        type: SEND.HANDLE_SELECT_CURRENCY_CHANGE,
        outputId,
        localCurrency,
    });

    dispatch(composeChange('amount', send.setMaxActivated));
};

/*
    Change value in input "FiatInput"
 */
export const handleFiatInputChange = (outputId: number, fiatValue: string) => (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { send, selectedAccount } = getState().wallet;
    const fiat = getState().wallet.fiat.coins;
    if (!fiat || !send || selectedAccount.status !== 'loaded') return null;
    const { network } = selectedAccount;
    const output = getOutput(send.outputs, outputId);
    const fiatNetwork = fiat.find(item => item.symbol === network.symbol);
    if (!fiatNetwork) return null;
    const rate = fiatNetwork.current?.rates[output.localCurrency.value.value];
    if (!rate) return null;
    const amountBigNumber = new BigNumber(fiatValue || '0').dividedBy(new BigNumber(rate));
    const amount = amountBigNumber.isNaN() ? '' : amountBigNumber.toFixed(network.decimals);

    dispatch({
        type: SEND.HANDLE_FIAT_VALUE_CHANGE,
        outputId,
        fiatValue,
    });

    dispatch(amountChange(amount, outputId));

    dispatch(composeChange('amount', send.setMaxActivated));
};

/*
    Click on "set max"
 */
export const setMax = (outputIdIn?: number) => async (dispatch: Dispatch, getState: GetState) => {
    const { send, selectedAccount } = getState().wallet;
    const fiat = getState().wallet.fiat.coins;

    if (!fiat || !send || selectedAccount.status !== 'loaded') return null;
    const { account } = selectedAccount;
    const composedTransaction = await dispatch(compose(true));
    const outputId = outputIdIn || 0;
    const output = getOutput(send.outputs, outputId);
    const fiatNetwork = fiat.find(item => item.symbol === account.symbol);
    const { token } = send.networkTypeEthereum;
    const formattedAmount =
        composedTransaction && composedTransaction.type !== 'error' && !token
            ? formatNetworkAmount(composedTransaction.max, account.symbol)
            : undefined;

    dispatch({
        type: SEND.CHANGE_SET_MAX_STATE,
        activated: true,
    });

    if (fiatNetwork && formattedAmount) {
        const rate = fiatNetwork.current?.rates[output.localCurrency.value.value];
        if (rate) {
            const fiatValue = getFiatValue(formattedAmount, rate.toString());

            dispatch({
                type: SEND.HANDLE_FIAT_VALUE_CHANGE,
                outputId,
                fiatValue,
            });
        }
    }

    let amount = token ? token.balance! : '0';
    if (formattedAmount) {
        const maxBig = new BigNumber(formattedAmount);
        amount = maxBig.isLessThanOrEqualTo(0) ? '0' : formattedAmount;
    }

    dispatch(amountChange(amount, outputId));
    dispatch(composeChange('amount', send.setMaxActivated));
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

export const updateFeeOrNotify = () => (dispatch: Dispatch, getState: GetState) => {
    const { selectedAccount, send } = getState().wallet;
    if (selectedAccount.status !== 'loaded' || !send) return null;
    const { networkType, symbol } = selectedAccount.network;
    const updatedFeeInfo = getState().wallet.fees[symbol];
    const updatedLevels = getFeeLevels(
        networkType,
        updatedFeeInfo,
        !!send.networkTypeEthereum.token,
    );
    const { selectedFee, feeInfo } = send;
    const { levels } = feeInfo;
    const updatedSelectedFee = updatedLevels.find(level => level.label === selectedFee.label);
    const shouldUpdate = comparisonUtils.isChanged(levels, updatedLevels);

    if (!shouldUpdate) return null;

    if (selectedFee.label === 'custom') {
        dispatch({
            type: SEND.CHANGE_FEE_STATE,
            feeOutdated: true,
        });
    } else {
        if (!updatedSelectedFee) return null;

        let ethFees = {};
        if (networkType === 'ethereum') {
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
    const { networkType, symbol } = selectedAccount.network;
    const updatedFeeInfo = getState().wallet.fees[symbol];
    const updatedLevels = getFeeLevels(
        networkType,
        updatedFeeInfo,
        !!send.networkTypeEthereum.token,
    );
    const updatedSelectedFee = updatedLevels.find(level => level.label === 'normal');

    if (!updatedSelectedFee) return null;

    let ethFees = {};
    if (networkType === 'ethereum') {
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

export const handleTokenSelectChange = (token?: TokenInfo) => (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { send } = getState().wallet;
    if (!send) return;

    dispatch({
        type: SEND.ETH_HANDLE_TOKEN,
        token,
    });

    // update fee levels
    dispatch(manuallyUpdateFee());

    if (send.setMaxActivated) {
        // trigger amount validation in compose
        dispatch(setMax());
    } else {
        // trigger amount validation in reducer
        dispatch(amountChange());
    }
};

/*
    Clear to default state
*/
export const clear = () => (dispatch: Dispatch) => {
    dispatch(manuallyUpdateFee());
};
