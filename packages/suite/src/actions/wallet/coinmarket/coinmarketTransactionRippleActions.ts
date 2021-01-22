import TrezorConnect, { FeeLevel, RipplePayment } from 'trezor-connect';
import BigNumber from 'bignumber.js';
import {
    ComposeTransactionData,
    ReviewTransactionData,
    SignTransactionData,
} from '@wallet-types/transaction';
import * as notificationActions from '@suite-actions/notificationActions';
import { calculateTotal, calculateMax } from '@wallet-utils/sendFormUtils';
import { getExternalComposeOutput } from '@wallet-utils/exchangeFormUtils';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { XRP_FLAG } from '@wallet-constants/sendForm';
import { PrecomposedLevels, PrecomposedTransaction, ExternalOutput } from '@wallet-types/sendForm';
import { Dispatch, GetState } from '@suite-types';
import { outputsWithFinalAddress } from './coinmarketTransactionBitcoinActions';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';

const calculate = (
    availableBalance: string,
    output: ExternalOutput,
    feeLevel: FeeLevel,
): PrecomposedTransaction => {
    const feeInSatoshi = feeLevel.feePerUnit;

    let amount: string;
    let max: string | undefined;
    if (output.type === 'send-max' || output.type === 'send-max-noaddress') {
        max = calculateMax(availableBalance, feeInSatoshi);
        amount = max;
    } else {
        amount = output.amount;
    }
    const totalSpent = new BigNumber(calculateTotal(amount, feeInSatoshi));

    if (totalSpent.isGreaterThan(availableBalance)) {
        return {
            type: 'error',
            error: 'AMOUNT_IS_NOT_ENOUGH',
            errorMessage: { id: 'AMOUNT_IS_NOT_ENOUGH' },
        } as const;
    }

    const payloadData = {
        type: 'nonfinal',
        totalSpent: totalSpent.toString(),
        max,
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
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        script_type: 'PAYTOADDRESS',
                    },
                ],
            },
        };
    }
    return payloadData;
};

export const composeTransaction = (composeTransactionData: ComposeTransactionData) => () => {
    const { account, feeInfo } = composeTransactionData;
    const composeOutputs = getExternalComposeOutput(composeTransactionData);
    if (!composeOutputs) return; // no valid Output

    const { output } = composeOutputs;
    const { availableBalance } = account;
    const predefinedLevels = feeInfo.levels.filter(l => l.label !== 'custom');
    // in case when selectedFee is set to 'custom' construct this FeeLevel from values
    if (composeTransactionData.selectedFee === 'custom') {
        predefinedLevels.push({
            label: 'custom',
            feePerUnit: composeTransactionData.feePerUnit,
            blocks: -1,
        });
    }

    // wrap response into PrecomposedLevels object where key is a FeeLevel label
    const wrappedResponse: PrecomposedLevels = {};
    const response = predefinedLevels.map(level => calculate(availableBalance, output, level));
    response.forEach((tx, index) => {
        const feeLabel = predefinedLevels[index].label as FeeLevel['label'];
        wrappedResponse[feeLabel] = tx;
    });

    const hasAtLeastOneValid = response.find(r => r.type !== 'error');
    // there is no valid tx in predefinedLevels and there is no custom level
    if (!hasAtLeastOneValid && !wrappedResponse.custom) {
        const { minFee } = feeInfo;
        const lastKnownFee = predefinedLevels[predefinedLevels.length - 1].feePerUnit;
        let maxFee = new BigNumber(lastKnownFee).minus(1);
        // generate custom levels in range from lastKnownFee -1 to feeInfo.minFee (coinInfo in trezor-connect)
        const customLevels: FeeLevel[] = [];
        while (maxFee.gte(minFee)) {
            customLevels.push({ feePerUnit: maxFee.toString(), label: 'custom', blocks: -1 });
            maxFee = maxFee.minus(1);
        }

        const customLevelsResponse = customLevels.map(level =>
            calculate(availableBalance, output, level),
        );

        const customValid = customLevelsResponse.findIndex(r => r.type !== 'error');
        if (customValid >= 0) {
            wrappedResponse.custom = customLevelsResponse[customValid];
        }
    }

    // format max (calculate sends it as satoshi)
    // update errorMessage values (reserve)
    Object.keys(wrappedResponse).forEach(key => {
        const tx = wrappedResponse[key];
        if (tx.type !== 'error' && tx.max) {
            tx.max = formatNetworkAmount(tx.max, account.symbol);
        }
    });

    return wrappedResponse;
};

export const signTransaction = (data: SignTransactionData) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { selectedAccount } = getState().wallet;
    const { device } = getState().suite;
    if (selectedAccount.status !== 'loaded' || !device || !data.transactionInfo) return;
    const { account } = selectedAccount;
    if (account.networkType !== 'ripple') return;

    const updatedOutputs = outputsWithFinalAddress(
        data.address,
        data.transactionInfo.transaction.outputs,
    );
    if (!updatedOutputs) {
        dispatch(
            notificationActions.addToast({
                type: 'sign-tx-error',
                error: 'Invalid transaction outputs',
            }),
        );
        return;
    }

    const payment: RipplePayment = {
        destination: data.address,
        amount: data.transactionInfo.transaction.outputs[0].amount,
    };

    if (data.destinationTag) {
        payment.destinationTag = parseInt(data.destinationTag, 10);
    }

    const reviewData: ReviewTransactionData = {
        signedTx: undefined,
        transactionInfo: {
            ...data.transactionInfo,
            transaction: { ...data.transactionInfo.transaction, outputs: updatedOutputs },
        },
        extraFields: {
            destinationTag: data.destinationTag || undefined,
        },
    };

    dispatch(coinmarketCommonActions.saveTransactionReview(reviewData));

    const signedTx = await TrezorConnect.rippleSignTransaction({
        device: {
            path: device.path,
            instance: device.instance,
            state: device.state,
        },
        useEmptyPassphrase: device.useEmptyPassphrase,
        path: account.path,
        transaction: {
            fee: data.transactionInfo.feePerByte,
            flags: XRP_FLAG,
            sequence: account.misc.sequence,
            payment,
        },
    });
    if (!signedTx.success) {
        // catch manual error from ReviewTransaction modal
        if (signedTx.payload.error === 'tx-cancelled') return;
        dispatch(
            notificationActions.addToast({
                type: 'sign-tx-error',
                error: signedTx.payload.error,
            }),
        );
        return;
    }

    return {
        ...reviewData,
        signedTx: {
            tx: signedTx.payload.serializedTx,
            coin: account.symbol,
        },
    };
};
