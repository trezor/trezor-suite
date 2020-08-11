import TrezorConnect, { FeeLevel, PrecomposedTransaction } from 'trezor-connect';
import BigNumber from 'bignumber.js';
import { toWei, fromWei } from 'web3-utils';
import {
    calculateTotal,
    calculateMax,
    calculateEthFee,
    serializeEthereumTx,
    prepareEthereumTransaction,
    findValidOutputs,
} from '@wallet-utils/sendFormUtils';
import { FormState, SendContextProps, PrecomposedLevels } from '@wallet-types/sendForm';
import {
    networkAmountToSatoshi,
    formatNetworkAmount,
    getAccountKey,
} from '@wallet-utils/accountUtils';
import * as notificationActions from '@suite-actions/notificationActions';
import { requestPushTransaction } from '@wallet-actions/sendFormActions'; // move to common?
import { SEND } from '@wallet-actions/constants';
import { Dispatch, GetState } from '@suite-types';

const calc = (availableBalance: string, output: any, feeLevel: FeeLevel, token?: any) => {
    const feeInSatoshi = calculateEthFee(
        toWei(feeLevel.feePerUnit, 'gwei'),
        feeLevel.feeLimit || '0',
    );

    const isSendMax = output.type === 'send-max' || output.type === 'send-max-noaddress';
    const composedType = !output.type || output.type === 'send-max' ? 'final' : 'nonfinal';

    let max;
    let totalSpent;
    if (isSendMax) {
        max = token
            ? new BigNumber(token.balance!)
            : new BigNumber(calculateMax(availableBalance, feeInSatoshi));
        totalSpent = new BigNumber(calculateTotal(token ? '0' : max.toString(), feeInSatoshi));
    } else {
        totalSpent = new BigNumber(calculateTotal(token ? '0' : output.amount, feeInSatoshi));
    }

    // const totalSpentBig = new BigNumber(calculateTotal(token ? '0' : amount, feeInSatoshi));
    // const totalSpentBig = new BigNumber(calculateTotal('0', feeInSatoshi));

    if (totalSpent.isGreaterThan(availableBalance)) {
        const error = token ? 'NOT-ENOUGH-CURRENCY-FEE' : 'NOT-ENOUGH-FUNDS';
        return { type: 'error', error } as const;
    }

    const payloadData = {
        totalSpent: totalSpent.toString(),
        fee: feeInSatoshi,
        feePerByte: feeLevel.feePerUnit,
        feeLimit: feeLevel.feeLimit,
        max: max ? max.toString() : undefined,
    };

    const txOutputs =
        composedType === 'final'
            ? [
                  {
                      address: output.address,
                      amount: max ? max.toString() : output.amount,
                  },
              ]
            : [];

    return {
        type: composedType,
        ...payloadData,
        transaction: {
            inputs: [], // just for compatibility with BTC
            outputs: txOutputs,
        },
    };
};

export const composeTransaction = async (
    formValues: FormState,
    account: SendContextProps['account'],
    feeInfo: SendContextProps['feeInfo'],
) => {
    const { availableBalance } = account;
    const { address, amount } = formValues.outputs[0];
    const amountInSatoshi = networkAmountToSatoshi(amount, account.symbol).toString();
    // const max = formValues.token
    //     ? new BigNumber(formValues.token.balance!)
    //     : new BigNumber(calculateMax(account.availableBalance, feeInSatoshi));

    const isMaxActive = typeof formValues.setMaxOutputId === 'number';
    const outputs = [];

    if (isMaxActive) {
        if (address) {
            outputs.push({
                address,
                type: 'send-max',
            });
        } else {
            outputs.push({
                type: 'send-max-noaddress',
            });
        }
    } else if (address) {
        outputs.push({
            address,
            amount: amountInSatoshi,
        });
    } else {
        outputs.push({
            type: 'noaddress',
            amount: amountInSatoshi,
        });
    }

    let dataFeeLimit: string | undefined;

    if (typeof formValues.ethereumDataHex === 'string' && formValues.ethereumDataHex.length > 0) {
        const response = await TrezorConnect.blockchainEstimateFee({
            coin: account.symbol,
            request: {
                blocks: [2],
                specific: {
                    from: account.descriptor,
                    to: address || account.descriptor,
                    data: formValues.ethereumDataHex,
                },
            },
        });

        if (response.success) {
            dataFeeLimit = response.payload.levels[0].feeLimit;
        }
    }

    const predefinedLevels = feeInfo.levels.filter(l => l.label !== 'custom');
    // in case when selectedFee is set to 'custom' construct this FeeLevel from values
    if (formValues.selectedFee === 'custom') {
        predefinedLevels.push({
            label: 'custom',
            feePerUnit: formValues.feePerUnit,
            feeLimit: formValues.feeLimit,
            blocks: -1,
        });
    }

    // update predefined levels feeLimit (gas limit from data size)
    if (dataFeeLimit) {
        predefinedLevels.forEach(l => (l.feeLimit = dataFeeLimit));
    }
    const wrappedResponse: PrecomposedLevels = {};
    const response = predefinedLevels.map(level => calc(availableBalance, outputs[0], level));
    response.forEach((tx, index) => {
        const feeLabel = predefinedLevels[index].label as FeeLevel['label'];
        wrappedResponse[feeLabel] = tx;
    });

    const hasAtLeastOneValid = response.find(r => r.type !== 'error');
    if (!hasAtLeastOneValid && !wrappedResponse.custom) {
        const { minFee } = feeInfo;
        console.warn('LEVELS', predefinedLevels);
        let maxFee = new BigNumber(predefinedLevels[predefinedLevels.length - 1].feePerUnit).minus(
            1,
        );
        const customLevels: any[] = [];
        while (maxFee.gte(minFee)) {
            customLevels.push({
                feePerUnit: maxFee.toString(),
                feeLimit: predefinedLevels[0].feeLimit,
                label: 'custom',
            });
            maxFee = maxFee.minus(1);
        }

        console.warn('CUSTOM LEVELS!', customLevels, wrappedResponse);

        if (!customLevels.length) return wrappedResponse;

        const customLevelsResponse = customLevels.map(level =>
            calc(availableBalance, outputs[0], level),
        );

        console.warn('CUSTOM LEVELS RESPONSE', customLevelsResponse);

        const customValid = customLevelsResponse.findIndex(r => r.type !== 'error');
        if (customValid >= 0) {
            wrappedResponse.custom = customLevelsResponse[customValid];
        }
    }

    return wrappedResponse;
};

export const signTransaction = (
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

    const { account, network } = selectedAccount;
    if (account.networkType !== 'ethereum' || !network.chainId) return;

    dispatch({
        type: SEND.REQUEST_SIGN_TRANSACTION,
        payload: {
            formValues,
            transactionInfo,
        },
    });

    const transaction = prepareEthereumTransaction({
        token: undefined,
        // token: token || undefined,
        chainId: network.chainId,
        to: formValues.outputs[0].address,
        amount: formValues.outputs[0].amount,
        data: formValues.ethereumDataHex,
        gasLimit: transactionInfo.feeLimit,
        gasPrice: transactionInfo.feePerByte,
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

    const serializedTx = serializeEthereumTx({
        ...transaction,
        ...signedTx.payload,
    });

    return dispatch(
        requestPushTransaction({
            tx: serializedTx,
            coin: account.symbol,
        }),
    );
};
