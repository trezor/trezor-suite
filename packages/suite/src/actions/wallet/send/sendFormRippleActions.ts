import TrezorConnect, { FeeLevel, RipplePayment } from 'trezor-connect';
import BigNumber from 'bignumber.js';
import * as notificationActions from '@suite-actions/notificationActions';
import {
    calculateTotal,
    calculateMax,
    getExternalComposeOutput,
} from '@wallet-utils/sendFormUtils';
import { networkAmountToSatoshi, formatNetworkAmount } from '@wallet-utils/accountUtils';
import { XRP_FLAG } from '@wallet-constants/sendForm';
import {
    FormState,
    UseSendFormState,
    PrecomposedLevels,
    PrecomposedTransaction,
    PrecomposedTransactionFinal,
    ExternalOutput,
} from '@wallet-types/sendForm';
import { Dispatch, GetState } from '@suite-types';

const calculate = (
    availableBalance: string,
    output: ExternalOutput,
    feeLevel: FeeLevel,
    requiredAmount?: BigNumber,
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

    if (requiredAmount && requiredAmount.gt(amount)) {
        return {
            type: 'error',
            error: 'AMOUNT_IS_LESS_THAN_RESERVE',
            // errorMessage declared later
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

export const composeTransaction = (
    formValues: FormState,
    formState: UseSendFormState,
) => async () => {
    const { account, network, feeInfo } = formState;
    const composeOutputs = getExternalComposeOutput(formValues, account, network);
    if (!composeOutputs) return; // no valid Output

    const { output } = composeOutputs;
    const { availableBalance } = account;
    const { address } = formValues.outputs[0];

    const predefinedLevels = feeInfo.levels.filter(l => l.label !== 'custom');
    // in case when selectedFee is set to 'custom' construct this FeeLevel from values
    if (formValues.selectedFee === 'custom') {
        predefinedLevels.push({
            label: 'custom',
            feePerUnit: formValues.feePerUnit,
            blocks: -1,
        });
    }

    let requiredAmount: BigNumber | undefined;
    // additional check if recipient address is empty
    // it will set requiredAmount to recipient account reserve value
    if (address) {
        const accountResponse = await TrezorConnect.getAccountInfo({
            descriptor: address,
            coin: account.symbol,
        });
        if (accountResponse.success && accountResponse.payload.empty) {
            requiredAmount = new BigNumber(accountResponse.payload.misc!.reserve!);
        }
    }

    // wrap response into PrecomposedLevels object where key is a FeeLevel label
    const wrappedResponse: PrecomposedLevels = {};
    const response = predefinedLevels.map(level =>
        calculate(availableBalance, output, level, requiredAmount),
    );
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
            calculate(availableBalance, output, level, requiredAmount),
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
        if (tx.type === 'error' && tx.error === 'AMOUNT_IS_LESS_THAN_RESERVE' && requiredAmount) {
            tx.errorMessage = {
                id: 'AMOUNT_IS_LESS_THAN_RESERVE',
                values: {
                    reserve: formatNetworkAmount(requiredAmount.toString(), account.symbol),
                },
            };
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

    return signedTx.payload.serializedTx;
};
