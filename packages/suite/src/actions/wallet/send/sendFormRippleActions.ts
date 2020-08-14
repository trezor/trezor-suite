import TrezorConnect, { ComposeOutput, FeeLevel, RipplePayment } from 'trezor-connect';
import BigNumber from 'bignumber.js';

import { calculateTotal, calculateMax } from '@wallet-utils/sendFormUtils';
import {
    FormState,
    SendContextProps,
    PrecomposedLevels,
    PrecomposedTransaction,
    PrecomposedTransactionFinal,
} from '@wallet-types/sendForm';

import { networkAmountToSatoshi, formatNetworkAmount } from '@wallet-utils/accountUtils';

import { XRP_FLAG } from '@wallet-constants/sendForm';
import { SEND } from '@wallet-actions/constants';
import { Dispatch, GetState } from '@suite-types';

import * as notificationActions from '@suite-actions/notificationActions';
import { requestPushTransaction } from '@wallet-actions/sendFormActions'; // move to common?

type XrpOutput = Exclude<ComposeOutput, { type: 'opreturn' } | { address_n: number[] }>;

const calculate = (
    availableBalance: string,
    output: XrpOutput,
    feeLevel: FeeLevel,
): PrecomposedTransaction => {
    const feeInSatoshi = feeLevel.feePerUnit;

    let amount;
    let max;
    let totalSpent;
    if (output.type === 'send-max' || output.type === 'send-max-noaddress') {
        max = new BigNumber(calculateMax(availableBalance, feeInSatoshi));
        amount = max.toString();
        totalSpent = new BigNumber(calculateTotal(amount, feeInSatoshi));
    } else {
        amount = output.amount;
        totalSpent = new BigNumber(calculateTotal(output.amount, feeInSatoshi));
    }

    // const totalSpentBig = new BigNumber(calculateTotal(token ? '0' : amount, feeInSatoshi));
    // const totalSpentBig = new BigNumber(calculateTotal('0', feeInSatoshi));

    if (totalSpent.isGreaterThan(availableBalance)) {
        const error = 'NOT-ENOUGH-FUNDS';
        return { type: 'error', error } as const;
    }

    const payloadData = {
        type: 'nonfinal',
        totalSpent: totalSpent.toString(),
        max: max ? max.toString() : undefined,
        fee: feeInSatoshi,
        feePerByte: feeLevel.feePerUnit,
        bytes: 0, // TODO: calculate
    } as const;

    if (output.type === 'send-max' || output.type === 'external') {
        return {
            ...payloadData,
            type: 'final',
            // compatibility with BTC PrecomposedTransaction from trezor-connect
            transaction: {
                inputs: [],
                outputs: [
                    {
                        address: output.address,
                        amount,
                        // eslint-disable-next-line @typescript-eslint/camelcase
                        script_type: 'PAYTOADDRESS',
                    },
                ],
            },
        };
    }
    return payloadData;
};

export const composeTransaction = (
    formValues: FormState,
    formState: SendContextProps,
) => async () => {
    const { account, feeInfo } = formState;
    const { availableBalance } = account;
    const { address, amount } = formValues.outputs[0];
    const amountInSatoshi = networkAmountToSatoshi(amount, account.symbol).toString();
    const isMaxActive = typeof formValues.setMaxOutputId === 'number';

    let output: XrpOutput;
    if (isMaxActive) {
        if (address) {
            output = {
                type: 'send-max',
                address,
            };
        } else {
            output = {
                type: 'send-max-noaddress',
            };
        }
    } else if (address) {
        output = {
            type: 'external',
            address,
            amount: amountInSatoshi,
        };
    } else {
        output = {
            type: 'noaddress',
            amount: amountInSatoshi,
        };
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
    const wrappedResponse: PrecomposedLevels = {};
    const response = predefinedLevels.map(level => calculate(availableBalance, output, level));
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
        const customLevels: FeeLevel[] = [];
        while (maxFee.gte(minFee)) {
            customLevels.push({ feePerUnit: maxFee.toString(), label: 'custom', blocks: -1 });
            maxFee = maxFee.minus(1);
        }

        console.warn('CUSTOM LEVELS!', customLevels, wrappedResponse);

        const customLevelsResponse = customLevels.map(level =>
            calculate(availableBalance, output, level),
        );

        console.warn('CUSTOM LEVELS RESPONSE', customLevelsResponse);

        const customValid = customLevelsResponse.findIndex(r => r.type !== 'error');
        if (customValid >= 0) {
            wrappedResponse.custom = customLevelsResponse[customValid];
        }
    }

    // format max
    Object.keys(wrappedResponse).forEach(key => {
        const tx = wrappedResponse[key];
        if (tx.type !== 'error' && tx.max) {
            tx.max = formatNetworkAmount(tx.max, account.symbol);
        }
    });

    return wrappedResponse;
};

export const signTransaction = (
    formValues: FormState,
    transactionInfo: PrecomposedTransactionFinal,
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
    const { account } = selectedAccount;
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
};
