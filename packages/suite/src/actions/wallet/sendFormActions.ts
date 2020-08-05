import TrezorConnect, {
    FeeLevel,
    RipplePayment,
    PrecomposedTransaction,
    SignTransaction,
    TransactionInput,
} from 'trezor-connect';
import BigNumber from 'bignumber.js';
import { toWei, fromWei } from 'web3-utils';
import { useForm } from 'react-hook-form';
import * as accountActions from '@wallet-actions/accountActions';
import * as notificationActions from '@suite-actions/notificationActions';
import * as modalActions from '@suite-actions/modalActions';
import { SendContext } from '@wallet-hooks/useSendContext'; // to remove
import { SEND } from '@wallet-actions/constants';
import {
    ZEC_SIGN_ENHANCEMENT,
    XRP_FLAG,
    BTC_RBF_SEQUENCE,
    BTC_LOCKTIME_SEQUENCE,
} from '@wallet-constants/sendForm';

import { ParsedURI } from '@wallet-utils/cryptoUriParser';
import {
    networkAmountToSatoshi,
    formatNetworkAmount,
    getAccountKey,
} from '@wallet-utils/accountUtils';
import {
    calculateTotal,
    calculateMax,
    calculateEthFee,
    getFeeLevels,
    serializeEthereumTx,
    prepareEthereumTransaction,
    findValidOutputs,
} from '@wallet-utils/sendFormUtils';

import { Dispatch, GetState } from '@suite-types';
import { Account } from '@wallet-types';
import { FormState, SendContextProps, PrecomposedLevels } from '@wallet-types/sendForm';

export type SendFormActions =
    | {
          type: typeof SEND.STORE_DRAFT;
          key: string;
          formState: FormState;
      }
    | {
          type: typeof SEND.REMOVE_DRAFT;
          key: string;
      }
    | {
          type: typeof SEND.SET_LAST_USED_FEE_LEVEL;
          symbol: Account['symbol'];
          feeLevelLabel: FeeLevel['label'];
      }
    | {
          type: typeof SEND.REQUEST_SIGN_TRANSACTION;
          payload?: {
              formValues: FormState;
              transactionInfo: Extract<PrecomposedTransaction, { type: 'final' }>;
          };
      }
    | {
          type: typeof SEND.REQUEST_PUSH_TRANSACTION;
          payload?: {
              tx: string;
              coin: Account['symbol'];
          };
      };

export const saveDraft = (formState: FormState) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { selectedAccount } = getState().wallet;
    if (selectedAccount.status !== 'loaded') return null;
    const { account } = selectedAccount;
    const { symbol, descriptor, deviceState } = account;
    const key = getAccountKey(descriptor, symbol, deviceState);

    dispatch({
        type: SEND.STORE_DRAFT,
        key,
        formState,
    });
};

export const setLastUsedFeeLevel = (
    feeLevelLabel: FeeLevel['label'],
    symbol: Account['symbol'],
) => (dispatch: Dispatch) => {
    dispatch({
        type: SEND.SET_LAST_USED_FEE_LEVEL,
        symbol,
        feeLevelLabel,
    });
};

export const getDraft = () => (_dispatch: Dispatch, getState: GetState) => {
    const { selectedAccount, send } = getState().wallet;
    if (selectedAccount.status !== 'loaded') return;
    const { account } = selectedAccount;
    const { symbol, descriptor, deviceState } = account;
    const key = getAccountKey(descriptor, symbol, deviceState);

    return send.drafts[key];
};

export const removeDraft = () => (dispatch: Dispatch, getState: GetState) => {
    const { selectedAccount, send } = getState().wallet;
    if (selectedAccount.status !== 'loaded') return;
    const { account } = selectedAccount;
    const { symbol, descriptor, deviceState } = account;
    const key = getAccountKey(descriptor, symbol, deviceState);

    if (send.drafts[key]) {
        dispatch({
            type: SEND.REMOVE_DRAFT,
            key,
        });
    }
};

export const composeRippleTransaction = (
    account: SendContext['account'],
    getValues: ReturnType<typeof useForm>['getValues'],
    selectedFee: SendContext['selectedFee'],
) => {
    const amount = getValues('amount[0]');
    const address = getValues('address[0]');
    const amountInSatoshi = networkAmountToSatoshi(amount, account.symbol).toString();
    const { availableBalance } = account;
    const feeInSatoshi = selectedFee.feePerUnit;
    const totalSpentBig = new BigNumber(calculateTotal(amountInSatoshi, feeInSatoshi));
    const max = new BigNumber(calculateMax(availableBalance, feeInSatoshi));
    const formattedMax = max.isLessThan('0')
        ? ''
        : formatNetworkAmount(max.toString(), account.symbol);

    const payloadData = {
        totalSpent: totalSpentBig.toString(),
        fee: feeInSatoshi,
        max: formattedMax,
    };

    if (!address && formattedMax !== '0') {
        return {
            type: 'nonfinal',
            ...payloadData,
        };
    }

    if (totalSpentBig.isGreaterThan(availableBalance)) {
        return {
            type: 'error',
            error: 'NOT-ENOUGH-FUNDS',
        };
    }

    return {
        type: 'final',
        ...payloadData,
    };
};

export const composeEthereumTransaction = (
    account: SendContext['account'],
    getValues: ReturnType<typeof useForm>['getValues'],
    selectedFee: SendContext['selectedFee'],
    token: SendContext['token'],
    setMax = false,
) => {
    const amount = getValues('amount[0]');
    const address = getValues('address[0]');
    const isFeeValid = !new BigNumber(selectedFee.feePerUnit).isNaN();
    const { availableBalance } = account;
    const feeInSatoshi = calculateEthFee(
        toWei(isFeeValid ? selectedFee.feePerUnit : '0', 'gwei'),
        selectedFee.feeLimit || '0',
    );
    const max = token
        ? new BigNumber(token.balance!)
        : new BigNumber(calculateMax(availableBalance, feeInSatoshi));
    // use max possible value or input.value
    // race condition when switching between tokens with set-max enabled
    // input still holds previous value (previous token max)
    const amountInSatoshi = setMax
        ? max.toString()
        : networkAmountToSatoshi(amount, account.symbol).toString();

    const totalSpentBig = new BigNumber(
        calculateTotal(token ? '0' : amountInSatoshi, feeInSatoshi),
    );

    let formattedMax = max.isLessThan('0') ? '0' : max.toString();

    if (!token) {
        formattedMax = max.isLessThan('0')
            ? '0'
            : formatNetworkAmount(max.toString(), account.symbol);
    }

    const payloadData = {
        totalSpent: totalSpentBig.toString(),
        fee: feeInSatoshi,
        feePerUnit: selectedFee.feePerUnit,
        max: formattedMax,
    };

    if (!address && formattedMax !== '0') {
        return {
            type: 'nonfinal',
            ...payloadData,
        };
    }

    if (totalSpentBig.isGreaterThan(availableBalance)) {
        const error = token ? 'NOT-ENOUGH-CURRENCY-FEE' : 'NOT-ENOUGH-FUNDS';
        return { type: 'error', error } as const;
    }

    return {
        type: 'final',
        ...payloadData,
    };
};

export const composeBitcoinTransaction = async (
    formValues: FormState,
    account: SendContextProps['account'],
    feeInfo: SendContextProps['feeInfo'],
) => {
    const { outputs } = formValues;
    if (!account.addresses || !account.utxo) return;

    const composedOutputs = outputs
        .map((output, index) => {
            if (output.type === 'opreturn') {
                return {
                    type: 'opreturn',
                    dataHex: output.dataHex,
                } as const;
            }

            const { address } = output;
            const isMaxActive = formValues.setMaxOutputId === index;
            if (isMaxActive) {
                if (address) {
                    return {
                        address,
                        type: 'send-max',
                    } as const;
                }

                return {
                    type: 'send-max-noaddress',
                } as const;
            }

            const amount = networkAmountToSatoshi(output.amount, account.symbol);
            if (address) {
                return {
                    address,
                    amount,
                } as const;
            }

            return {
                type: 'noaddress',
                amount,
            } as const;
        })
        .filter(output => !output.amount || output.amount !== '0');

    if (composedOutputs.length < 1) return;

    const predefinedLevels = feeInfo.levels.filter(l => l.label !== 'custom');
    // in case when selectedFee is set to 'custom' construct this FeeLevel from values
    if (formValues.selectedFee === 'custom') {
        predefinedLevels.push({
            label: 'custom',
            feePerUnit: formValues.feePerUnit,
            blocks: -1,
        });
    }
    const params = {
        account: {
            path: account.path,
            addresses: account.addresses,
            // it is technically possible to have utxo with amount '0' see: https://tbtc1.trezor.io/tx/352873fe6cd5a83ca4b02737848d7d839aab864b8223c5ba7150ae35c22f4e38
            // however they should be excluded to avoid increase fee
            // TODO: this should be fixed in TrezorConnect + hd-wallet.composeTx? (connect throws: 'Segwit output without amount' error)
            utxo: account.utxo.filter(input => input.amount !== '0'),
        },
        feeLevels: predefinedLevels,
        outputs: composedOutputs,
        coin: account.symbol,
    };

    const response = await TrezorConnect.composeTransaction({
        ...params,
        account: params.account, // needs to be present in order to correct resolve of trezor-connect params overload
    });

    if (!response.success) return; // TODO: show toast?

    const wrappedResponse: PrecomposedLevels = {};

    response.payload.forEach((tx, index) => {
        const feeLabel = predefinedLevels[index].label as FeeLevel['label'];
        wrappedResponse[feeLabel] = tx;
    });

    const hasAtLeastOneValid = response.payload.find(r => r.type !== 'error');

    // there is no valid tx in predefinedLevels and there is no custom level
    if (!hasAtLeastOneValid && !wrappedResponse.custom) {
        const { minFee } = feeInfo;
        console.warn('LEVELS', predefinedLevels);
        let maxFee = new BigNumber(predefinedLevels[predefinedLevels.length - 1].feePerUnit).minus(
            1,
        );
        const customLevels: any[] = [];
        while (maxFee.gte(minFee)) {
            customLevels.push({ feePerUnit: maxFee.toString(), label: 'custom' });
            maxFee = maxFee.minus(1);
        }

        console.warn('CUSTOM LEVELS!', customLevels, wrappedResponse);

        if (!customLevels.length) return wrappedResponse;

        const customLevelsResponse = await TrezorConnect.composeTransaction({
            ...params,
            account: params.account, // needs to be present in order to correct resolve type of trezor-connect params overload
            feeLevels: customLevels,
        });

        console.warn('CUSTOM LEVELS RESPONSE', customLevelsResponse);

        if (!customLevelsResponse.success) return wrappedResponse; // TODO: show toast?

        const customValid = customLevelsResponse.payload.findIndex(r => r.type !== 'error');
        if (customValid >= 0) {
            wrappedResponse.custom = customLevelsResponse.payload[customValid];
        }
    }

    return wrappedResponse;
};

export const composeTransactionNew = (
    formValues: FormState,
    feeInfo: SendContextProps['feeInfo'],
) => async (_dispatch: Dispatch, getState: GetState) => {
    const { selectedAccount } = getState().wallet;
    if (selectedAccount.status !== 'loaded') return;

    const validOutputs = findValidOutputs(formValues);
    if (validOutputs.length === 0) return;

    const values = { ...formValues, outputs: validOutputs };

    const { account } = selectedAccount;
    if (account.networkType === 'bitcoin') {
        return composeBitcoinTransaction(values, account, feeInfo);
    }
    // TODO: translate formValues/sendValues to trezor-connect params
    // TODO: return precomposed transactions for multiple levels (will be stored in SendContext)
};

export const onQrScan = (
    parsedUri: ParsedURI,
    outputId: number,
    setValue: ReturnType<typeof useForm>['setValue'],
) => {
    const { address = '', amount } = parsedUri;
    setValue(`address[${outputId}]`, address);
    if (amount) {
        setValue(`amount[${outputId}]`, amount);
    }
};

// non-redux action
export const checkRippleEmptyAddress = async (
    descriptor: string,
    coin: SendContext['account']['symbol'],
) => {
    const response = await TrezorConnect.getAccountInfo({
        descriptor,
        coin,
    });

    if (response.success) {
        return response.payload.empty;
    }
    return false;
};

export const updateFiatInput = (
    id: number,
    fiatRates: SendContext['fiatRates'],
    getValues: ReturnType<typeof useForm>['getValues'],
    setValue: ReturnType<typeof useForm>['setValue'],
) => {
    if (fiatRates) {
        const localCurrency = getValues(`localCurrency[${id}]`);
        const rate = fiatRates.current?.rates[localCurrency.value];

        if (rate) {
            const oldValue = getValues(`amount[${id}]`);
            const fiatValueBigNumber = new BigNumber(oldValue).multipliedBy(new BigNumber(rate));
            const fiatValue = fiatValueBigNumber.isNaN() ? '' : fiatValueBigNumber.toFixed(2);
            setValue(`fiatInput[${id}]`, fiatValue);
        }
    }
};

const resetAllMax = (
    outputs: SendContext['outputs'],
    setValue: ReturnType<typeof useForm>['setValue'],
) => {
    outputs.map(output => setValue(`setMax[${output.id}]`, 'inactive'));
};

export const findActiveMaxId = (
    outputs: SendContext['outputs'],
    getValues: ReturnType<typeof useForm>['getValues'],
): number | null => {
    let maxId = null;
    outputs.forEach(output => {
        if (getValues(`setMax[${output.id}]`) === 'active') {
            maxId = output.id;
        }
    });

    return maxId;
};

export const composeTx = async (
    account: Account,
    getValues: ReturnType<typeof useForm>['getValues'],
    selectedFee: SendContext['selectedFee'],
    outputs: SendContext['outputs'],
    token: SendContext['token'],
    setMax = false,
): Promise<any> => {
    if (account.networkType === 'ripple') {
        return composeRippleTransaction(account, getValues, selectedFee);
    }

    if (account.networkType === 'ethereum') {
        return composeEthereumTransaction(account, getValues, selectedFee, token, setMax);
    }

    if (account.networkType === 'bitcoin') {
        return composeBitcoinTransaction(account, outputs, getValues, selectedFee);
    }
};

export const composeChange = async (
    id: number,
    account: Account,
    setTransactionInfo: SendContext['setTransactionInfo'],
    getValues: ReturnType<typeof useForm>['getValues'],
    setError: ReturnType<typeof useForm>['setError'],
    selectedFee: FeeLevel,
    outputs: SendContext['outputs'],
    token: SendContext['token'],
) => {
    console.warn('composeChange', id, getValues());
    const setMaxActive = getValues(`setMax[${id}]`) === 'active';
    const composedTransaction = await composeTx(
        account,
        getValues,
        selectedFee,
        outputs,
        token,
        setMaxActive,
    );

    if (!composedTransaction) return null; // TODO handle error

    if (composedTransaction.error) {
        switch (composedTransaction.error) {
            case 'NOT-ENOUGH-FUNDS':
                setError(`amount[${id}]`, 'TR_AMOUNT_IS_NOT_ENOUGH');
                break;
            case 'NOT-ENOUGH-CURRENCY-FEE':
                setError(`amount[${id}]`, 'NOT_ENOUGH_CURRENCY_FEE');
                break;
            // no default
        }
    }

    setTransactionInfo(composedTransaction);
};

export const updateMax = async (
    id: number | null,
    account: Account,
    setValue: ReturnType<typeof useForm>['setValue'],
    getValues: ReturnType<typeof useForm>['getValues'],
    clearError: ReturnType<typeof useForm>['clearError'],
    setError: ReturnType<typeof useForm>['setError'],
    selectedFee: FeeLevel,
    outputs: SendContext['outputs'],
    token: SendContext['token'],
    fiatRates: SendContext['fiatRates'],
    setTransactionInfo: SendContext['setTransactionInfo'],
) => {
    if (id === null) return;

    resetAllMax(outputs, setValue);
    setValue(`setMax[${id}]`, 'active');
    const composedTransaction = await composeTx(
        account,
        getValues,
        selectedFee,
        outputs,
        token,
        getValues(`setMax[${id}]`) === 'active',
    );

    if (!composedTransaction) return null;

    if (composedTransaction.type === 'error' || composedTransaction.error) {
        switch (composedTransaction.error) {
            case 'NOT-ENOUGH-FUNDS':
                setError(`amount[${id}]`, 'TR_AMOUNT_IS_NOT_ENOUGH');
                break;
            case 'NOT-ENOUGH-CURRENCY-FEE':
                setError(`amount[${id}]`, 'NOT_ENOUGH_CURRENCY_FEE');
                break;
            // no default
        }
        return;
    }

    if (composedTransaction && composedTransaction.error !== null) {
        clearError(`amount[${id}]`);
        setValue(`amount[${id}]`, composedTransaction.max);
        updateFiatInput(id, fiatRates, getValues, setValue);
        await composeChange(
            id,
            account,
            setTransactionInfo,
            getValues,
            setError,
            selectedFee,
            outputs,
            token,
        );
    }
};

export const updateFeeLevel = (
    coinFees: SendContext['coinFees'],
    token: SendContext['token'],
    setValue: ReturnType<typeof useForm>['setValue'],
    setSelectedFee: SendContext['setSelectedFee'],
    outputs: SendContext['outputs'],
    getValues: ReturnType<typeof useForm>['getValues'],
    clearError: ReturnType<typeof useForm>['clearError'],
    setError: ReturnType<typeof useForm>['setError'],
    fiatRates: SendContext['fiatRates'],
    setTransactionInfo: SendContext['setTransactionInfo'],
) => async (_dispatch: Dispatch, getState: GetState) => {
    const { selectedAccount } = getState().wallet;
    if (selectedAccount.status !== 'loaded') return null;
    const { account } = selectedAccount;
    const { networkType } = account;
    const updatedLevels = getFeeLevels(networkType, coinFees, !!token);
    const selectedFeeLevel = updatedLevels.find((level: FeeLevel) => level.label === 'normal');

    if (selectedFeeLevel) {
        if (networkType === 'ethereum') {
            setValue('ethereumGasPrice', selectedFeeLevel.feePerUnit);
            setValue('ethereumGasLimit', selectedFeeLevel.feeLimit);
        } else {
            setValue('customFee', null);
        }

        setSelectedFee(selectedFeeLevel);
        const activeMax = findActiveMaxId(outputs, getValues);
        await updateMax(
            activeMax,
            account,
            setValue,
            getValues,
            clearError,
            setError,
            selectedFeeLevel,
            outputs,
            token,
            fiatRates,
            setTransactionInfo,
        );
    }
};

export const updateFeeLevelWithData = (
    data: SendContext['defaultValues']['ethereumData'],
    setSelectedFee: SendContext['setSelectedFee'],
    initialSelectedFee: SendContext['initialSelectedFee'],
    token: SendContext['token'],
    setTransactionInfo: SendContext['setTransactionInfo'],
    outputs: SendContext['outputs'],
    fiatRates: SendContext['fiatRates'],
    setValue: ReturnType<typeof useForm>['setValue'],
    clearError: ReturnType<typeof useForm>['clearError'],
    setError: ReturnType<typeof useForm>['setError'],
    getValues: ReturnType<typeof useForm>['getValues'],
) => async (_dispatch: Dispatch, getState: GetState) => {
    const { selectedAccount } = getState().wallet;
    if (selectedAccount.status !== 'loaded') return null;
    const { account } = selectedAccount;
    const address = getValues('address[0]');
    const response = await TrezorConnect.blockchainEstimateFee({
        coin: account.symbol,
        request: {
            blocks: [2],
            specific: {
                from: account.descriptor,
                to: address || account.descriptor,
                data,
            },
        },
    });

    if (!response.success) return null;

    const level = response.payload.levels[0];
    const gasLimit = level.feeLimit || initialSelectedFee.feeLimit;
    const gasPrice = fromWei(level.feePerUnit, 'gwei');
    const newFeeLevel: SendContext['selectedFee'] = {
        label: 'normal',
        feePerUnit: gasPrice,
        feeLimit: gasLimit,
        blocks: -1,
    };

    setValue('ethereumGasPrice', gasPrice);
    setValue('ethereumGasLimit', gasLimit);
    setSelectedFee(newFeeLevel);

    const isMaxActive = getValues('setMax[0]') === 'active';

    if (isMaxActive) {
        await updateMax(
            0,
            account,
            setValue,
            getValues,
            clearError,
            setError,
            newFeeLevel,
            outputs,
            token,
            fiatRates,
            setTransactionInfo,
        );
    }
};

const requestPushTransaction = (payload: any) => (dispatch: Dispatch) => {
    dispatch({
        type: SEND.REQUEST_PUSH_TRANSACTION,
        payload,
    });

    return dispatch(modalActions.openDeferredModal({ type: 'review-transaction' }));
};

export const signBitcoinTransaction = (
    formValues: FormState,
    transactionInfo: PrecomposedTransaction,
) => async (dispatch: Dispatch, getState: GetState) => {
    const { selectedAccount } = getState().wallet;
    const { device } = getState().suite;
    if (
        selectedAccount.status !== 'loaded' ||
        !device ||
        !transactionInfo ||
        transactionInfo.type !== 'final'
    )
        return;

    dispatch({
        type: SEND.REQUEST_SIGN_TRANSACTION,
        payload: {
            formValues,
            transactionInfo,
        },
    });

    const { account } = selectedAccount;
    const { transaction } = transactionInfo;

    let sequence: number;
    let signEnhancement: Partial<SignTransaction> = {};

    if (account.symbol === 'zec') {
        signEnhancement = ZEC_SIGN_ENHANCEMENT;
    }

    if (formValues.bitcoinRBF) {
        // RBF is set, add sequence to inputs
        sequence = BTC_RBF_SEQUENCE;
    } else if (formValues.bitcoinLockTime) {
        // locktime is set, add sequence to inputs and add enhancement params
        sequence = BTC_LOCKTIME_SEQUENCE;
        signEnhancement.locktime = new BigNumber(formValues.bitcoinLockTime).toNumber();
    }

    const inputs = transaction.inputs
        .map(input => ({
            ...input,
            sequence,
        }))
        .filter(input => input.amount !== '0'); // remove '0' amounts

    inputs.forEach(input => {
        if (!input.amount) delete input.amount; // remove undefined amounts
        if (!input.sequence) delete input.sequence; // remove undefined sequence
    });

    const signPayload = {
        device: {
            path: device.path,
            instance: device.instance,
            state: device.state,
        },
        useEmptyPassphrase: device.useEmptyPassphrase,
        outputs: transaction.outputs,
        inputs,
        coin: account.symbol,
        ...signEnhancement,
    };

    const signedTx = await TrezorConnect.signTransaction(signPayload);

    if (!signedTx.success) {
        // catch manual error from cancelSigning
        if (signedTx.payload.error === 'tx-cancelled') return;
        dispatch(
            notificationActions.addToast({
                type: 'sign-tx-error',
                error: signedTx.payload.error,
            }),
        );
        return;
    }

    return dispatch(
        requestPushTransaction({
            tx: signedTx.payload.serializedTx,
            coin: account.symbol,
        }),
    );
};

export const signTransaction = (values: FormState, composedTx: any) => (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { selectedAccount } = getState().wallet;
    if (selectedAccount.status !== 'loaded') return;
    if (selectedAccount.account.networkType === 'bitcoin') {
        return dispatch(signBitcoinTransaction(values, composedTx));
    }
};

export const cancelSignTx = () => (dispatch: Dispatch, getState: GetState) => {
    const { signedTx } = getState().wallet.send;
    dispatch({ type: SEND.REQUEST_SIGN_TRANSACTION });
    dispatch({ type: SEND.REQUEST_PUSH_TRANSACTION });
    // if transaction is not signed yet interrupt signing in TrezorConnect
    if (!signedTx) {
        TrezorConnect.cancel('tx-cancelled');
        return;
    }
    // otherwise just close modal
    dispatch(modalActions.onCancel());
};

export const pushTransaction = () => async (dispatch: Dispatch, getState: GetState) => {
    const { signedTx, precomposedTx } = getState().wallet.send;
    const { account } = getState().wallet.selectedAccount;
    const { device } = getState().suite;
    if (!signedTx || !precomposedTx || !account) return false;

    // const sentTx = await TrezorConnect.pushTransaction(signedTx);
    const sentTx = { success: true, payload: { txid: 'ABC ' } };

    // close modal regardless result
    dispatch(cancelSignTx());

    const spentWithoutFee = new BigNumber(precomposedTx.totalSpent)
        .minus(precomposedTx.fee)
        .toString();

    if (sentTx.success) {
        dispatch(
            notificationActions.addToast({
                type: 'tx-sent',
                formattedAmount: formatNetworkAmount(spentWithoutFee, account.symbol, true),
                device,
                descriptor: account.descriptor,
                symbol: account.symbol,
                txid: sentTx.payload.txid,
            }),
        );

        dispatch(accountActions.fetchAndUpdateAccount(account));
    } else {
        dispatch(
            notificationActions.addToast({ type: 'sign-tx-error', error: sentTx.payload.error }),
        );
    }

    // resolve sign process
    return sentTx.success;
};

export const sendEthereumTransaction = (
    getValues: ReturnType<typeof useForm>['getValues'],
    token: SendContext['token'],
) => async (dispatch: Dispatch, getState: GetState): Promise<'error' | 'success'> => {
    const { selectedAccount } = getState().wallet;
    const { device } = getState().suite;
    if (selectedAccount.status !== 'loaded' || !device) return 'error';
    const { account, network } = selectedAccount;

    const amount = getValues('amount[0]');
    const address = getValues('address[0]');
    const data = getValues('ethereumData');
    const gasPrice = getValues('ethereumGasPrice');
    const gasLimit = getValues('ethereumGasLimit');

    if (account.networkType !== 'ethereum' || !network.chainId || !amount || !address)
        return 'error';

    const transaction = prepareEthereumTransaction({
        token: token || undefined,
        chainId: network.chainId,
        to: address,
        amount,
        data,
        gasLimit,
        gasPrice,
        nonce: account.misc.nonce,
    });

    const signedTx = await TrezorConnect.ethereumSignTransaction({
        device: {
            path: device.path,
            instance: device.instance,
            state: device.state,
        },
        useEmptyPassphrase: device.useEmptyPassphrase,
        path: account.path,
        transaction,
    });

    if (!signedTx.success) {
        dispatch(
            notificationActions.addToast({
                type: 'sign-tx-error',
                error: signedTx.payload.error,
            }),
        );

        return 'error';
    }

    const serializedTx = serializeEthereumTx({
        ...transaction,
        ...signedTx.payload,
    });

    // TODO: add possibility to show serialized tx without pushing (locktime)
    const sentTx = await TrezorConnect.pushTransaction({
        tx: serializedTx,
        coin: network.symbol,
    });

    if (sentTx.success) {
        dispatch(
            notificationActions.addToast({
                type: 'tx-sent',
                formattedAmount: `${amount} ${
                    token ? token.symbol!.toUpperCase() : account.symbol.toUpperCase()
                }`,
                device,
                descriptor: account.descriptor,
                symbol: account.symbol,
                txid: sentTx.payload.txid,
            }),
        );
        dispatch(accountActions.fetchAndUpdateAccount(account));
    } else {
        dispatch(
            notificationActions.addToast({
                type: 'sign-tx-error',
                error: sentTx.payload.error,
            }),
        );

        return 'error';
    }

    return 'success';
};

export const sendRippleTransaction = (
    getValues: ReturnType<typeof useForm>['getValues'],
    selectedFee: SendContext['selectedFee'],
) => async (dispatch: Dispatch, getState: GetState): Promise<'error' | 'success'> => {
    const { selectedAccount } = getState().wallet;
    const { device } = getState().suite;
    if (selectedAccount.status !== 'loaded' || !device) return 'error';
    const { account } = selectedAccount;
    const { symbol } = account;
    if (!account || account.networkType !== 'ripple') return 'error';

    const amount = getValues('amount[0]');
    const address = getValues('address[0]');
    const destinationTag = getValues('rippleDestinationTag');
    const { path, instance, state, useEmptyPassphrase } = device;

    const payment: RipplePayment = {
        destination: address,
        amount: networkAmountToSatoshi(amount, symbol),
    };

    if (destinationTag) {
        payment.destinationTag = parseInt(destinationTag, 10);
    }

    const signedTx = await TrezorConnect.rippleSignTransaction({
        device: {
            path,
            instance,
            state,
        },
        useEmptyPassphrase,
        path: account.path,
        transaction: {
            fee: selectedFee.feePerUnit,
            flags: XRP_FLAG,
            sequence: account.misc.sequence,
            payment,
        },
    });

    if (!signedTx.success) {
        dispatch(
            notificationActions.addToast({
                type: 'sign-tx-error',
                error: signedTx.payload.error,
            }),
        );

        return 'error';
    }

    // TODO: add possibility to show serialized tx without pushing (locktime)
    const sentTx = await TrezorConnect.pushTransaction({
        tx: signedTx.payload.serializedTx,
        coin: account.symbol,
    });

    if (sentTx.success) {
        dispatch(
            notificationActions.addToast({
                type: 'tx-sent',
                formattedAmount: `${amount} ${account.symbol.toUpperCase()}`,
                device,
                descriptor: account.descriptor,
                symbol: account.symbol,
                txid: sentTx.payload.txid,
            }),
        );

        dispatch(accountActions.fetchAndUpdateAccount(account));
    } else {
        dispatch(
            notificationActions.addToast({
                type: 'sign-tx-error',
                error: sentTx.payload.error,
            }),
        );

        return 'error';
    }

    return 'success';
};
