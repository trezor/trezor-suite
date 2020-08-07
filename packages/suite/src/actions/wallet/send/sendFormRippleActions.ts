import TrezorConnect, {
    FeeLevel,
    RipplePayment,
    PrecomposedTransaction,
    SignTransaction,
} from 'trezor-connect';
import BigNumber from 'bignumber.js';

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

import { XRP_FLAG } from '@wallet-constants/sendForm';
import { SEND } from '@wallet-actions/constants';
import { Dispatch, GetState } from '@suite-types';

import * as notificationActions from '@suite-actions/notificationActions';
import { requestPushTransaction } from '@wallet-actions/sendFormActions'; // move to common?

// export const composeTransaction = (
//     account: SendContext['account'],
//     getValues: ReturnType<typeof useForm>['getValues'],
//     selectedFee: SendContext['selectedFee'],
// ) => {
//     const amount = getValues('amount[0]');
//     const address = getValues('address[0]');
//     const amountInSatoshi = networkAmountToSatoshi(amount, account.symbol).toString();
//     const { availableBalance } = account;
//     const feeInSatoshi = selectedFee.feePerUnit;
//     const totalSpentBig = new BigNumber(calculateTotal(amountInSatoshi, feeInSatoshi));
//     const max = new BigNumber(calculateMax(availableBalance, feeInSatoshi));
//     const formattedMax = max.isLessThan('0')
//         ? ''
//         : formatNetworkAmount(max.toString(), account.symbol);

//     const payloadData = {
//         totalSpent: totalSpentBig.toString(),
//         fee: feeInSatoshi,
//         max: formattedMax,
//     };

//     if (!address && formattedMax !== '0') {
//         return {
//             type: 'nonfinal',
//             ...payloadData,
//         };
//     }

//     if (totalSpentBig.isGreaterThan(availableBalance)) {
//         return {
//             type: 'error',
//             error: 'NOT-ENOUGH-FUNDS',
//         };
//     }

//     return {
//         type: 'final',
//         ...payloadData,
//     };
// };

const calc = (availableBalance: string, output: any, feeLevel: FeeLevel, token?: any) => {
    const feeInSatoshi = feeLevel.feePerUnit;

    const isSendMax = output.type === 'send-max' || output.type === 'send-max-noaddress';
    const composedType = !output.type || output.type === 'send-max' ? 'final' : 'nonfinal';

    let max;
    let totalSpent;
    if (isSendMax) {
        max = new BigNumber(calculateMax(availableBalance, feeInSatoshi));
        totalSpent = new BigNumber(calculateTotal(max, feeInSatoshi));
    } else {
        totalSpent = new BigNumber(calculateTotal(output.amount, feeInSatoshi));
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

export const composeTransaction = (
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
    console.warn('KOMPOSE ITIR', outputs, predefinedLevels);
    const wrappedResponse: PrecomposedLevels = {};
    const response = predefinedLevels.map(level => calc(availableBalance, outputs[0], level));
    response.forEach((tx, index) => {
        const feeLabel = predefinedLevels[index].label as FeeLevel['label'];
        wrappedResponse[feeLabel] = tx;
    });

    console.warn('KOMPOSE ITIR2', response, predefinedLevels);

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
    if (account.networkType !== 'ripple') return;

    dispatch({
        type: SEND.REQUEST_SIGN_TRANSACTION,
        payload: {
            formValues,
            transactionInfo,
        },
    });

    const payment: RipplePayment = {
        destination: formValues.outputs[0].address,
        amount: networkAmountToSatoshi(formValues.outputs[0].amount, account.symbol),
    };

    if (formValues.rippleDestinationTag) {
        payment.destinationTag = parseInt(formValues.rippleDestinationTag, 10);
    }

    const signedTx = await TrezorConnect.rippleSignTransaction({
        device: {
            path: device.path,
            instance: device.instance,
            state: device.state,
        },
        useEmptyPassphrase: device.useEmptyPassphrase,
        path: account.path,
        transaction: {
            fee: transactionInfo.feePerByte,
            flags: XRP_FLAG,
            sequence: account.misc.sequence,
            payment,
        },
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

    return dispatch(
        requestPushTransaction({
            tx: signedTx.payload.serializedTx,
            coin: account.symbol,
        }),
    );

    // const { selectedAccount } = getState().wallet;
    // const { device } = getState().suite;
    // if (selectedAccount.status !== 'loaded' || !device) return 'error';
    // const { account } = selectedAccount;
    // const { symbol } = account;
    // if (!account || account.networkType !== 'ripple') return 'error';
    // const amount = getValues('amount[0]');
    // const address = getValues('address[0]');
    // const destinationTag = getValues('rippleDestinationTag');
    // const { path, instance, state, useEmptyPassphrase } = device;
    // const payment: RipplePayment = {
    //     destination: address,
    //     amount: networkAmountToSatoshi(amount, symbol),
    // };
    // if (destinationTag) {
    //     payment.destinationTag = parseInt(destinationTag, 10);
    // }

    // // TODO: add possibility to show serialized tx without pushing (locktime)
    // const sentTx = await TrezorConnect.pushTransaction({
    //     tx: signedTx.payload.serializedTx,
    //     coin: account.symbol,
    // });
    // if (sentTx.success) {
    //     dispatch(
    //         notificationActions.addToast({
    //             type: 'tx-sent',
    //             formattedAmount: `${amount} ${account.symbol.toUpperCase()}`,
    //             device,
    //             descriptor: account.descriptor,
    //             symbol: account.symbol,
    //             txid: sentTx.payload.txid,
    //         }),
    //     );
    //     dispatch(accountActions.fetchAndUpdateAccount(account));
    // } else {
    //     dispatch(
    //         notificationActions.addToast({
    //             type: 'sign-tx-error',
    //             error: sentTx.payload.error,
    //         }),
    //     );
    //     return 'error';
    // }
    // return 'success';
};
