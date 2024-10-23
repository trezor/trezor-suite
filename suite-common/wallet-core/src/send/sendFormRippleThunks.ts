import { BigNumber } from '@trezor/utils/src/bigNumber';
import TrezorConnect, { FeeLevel, RipplePayment } from '@trezor/connect';
import {
    calculateTotal,
    calculateMax,
    getExternalComposeOutput,
    networkAmountWithDecimals,
    formatNetworkAmount,
} from '@suite-common/wallet-utils';
import { XRP_FLAG } from '@suite-common/wallet-constants';
import {
    PrecomposedLevels,
    PrecomposedTransaction,
    ExternalOutput,
} from '@suite-common/wallet-types';
import { createThunk } from '@suite-common/redux-utils';
import { AddressDisplayOptions } from '@suite-common/wallet-types';

import {
    ComposeTransactionThunkArguments,
    ComposeFeeLevelsError,
    SignTransactionThunkArguments,
    SignTransactionError,
} from './sendFormTypes';
import { SEND_MODULE_PREFIX } from './sendFormConstants';

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
        type: 'nonfinal' as const,
        totalSpent: totalSpent.toString(),
        max,
        fee: feeInSatoshi,
        feePerByte: feeLevel.feePerUnit,
        bytes: 0, // TODO: calculate
        inputs: [],
    };

    if (output.type === 'send-max' || output.type === 'payment') {
        return {
            ...payloadData,
            type: 'final',
            // compatibility with BTC PrecomposedTransaction from @trezor/connect
            inputs: [],
            outputsPermutation: [0],
            outputs: [
                {
                    address: output.address,
                    amount,
                    script_type: 'PAYTOADDRESS',
                },
            ],
        };
    }

    return payloadData;
};

export const composeRippleTransactionFeeLevelsThunk = createThunk<
    PrecomposedLevels,
    ComposeTransactionThunkArguments,
    { rejectValue: ComposeFeeLevelsError }
>(
    `${SEND_MODULE_PREFIX}/composeEthereumTransactionFeeLevelsThunk`,
    async ({ formState, composeContext }, { rejectWithValue }) => {
        const { account, network, feeInfo } = composeContext;
        const composeOutputs = getExternalComposeOutput(formState, account, network);
        if (!composeOutputs)
            return rejectWithValue({
                error: 'fee-levels-compose-failed',
                message: 'Unable to compose output.',
            });

        const { output } = composeOutputs;
        const { availableBalance } = account;
        const { address } = formState.outputs[0];

        const predefinedLevels = feeInfo.levels.filter(l => l.label !== 'custom');
        // in case when selectedFee is set to 'custom' construct this FeeLevel from values
        if (formState.selectedFee === 'custom') {
            predefinedLevels.push({
                label: 'custom',
                feePerUnit: formState.feePerUnit,
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
                suppressBackupWarning: true,
            });
            if (accountResponse.success && accountResponse.payload.empty) {
                requiredAmount = new BigNumber(accountResponse.payload.misc!.reserve!);
            }
        }

        // wrap response into PrecomposedLevels object where key is a FeeLevel label
        const resultLevels: PrecomposedLevels = {};
        const response = predefinedLevels.map(level =>
            calculate(availableBalance, output, level, requiredAmount),
        );
        response.forEach((tx, index) => {
            const feeLabel = predefinedLevels[index].label as FeeLevel['label'];
            resultLevels[feeLabel] = tx;
        });

        const hasAtLeastOneValid = response.find(r => r.type !== 'error');
        // there is no valid tx in predefinedLevels and there is no custom level
        if (!hasAtLeastOneValid && !resultLevels.custom) {
            const { minFee } = feeInfo;
            const lastKnownFee = predefinedLevels[predefinedLevels.length - 1].feePerUnit;
            let maxFee = new BigNumber(lastKnownFee).minus(1);
            // generate custom levels in range from lastKnownFee -1 to feeInfo.minFee (coinInfo in @trezor/connect)
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
                resultLevels.custom = customLevelsResponse[customValid];
            }
        }

        // format max (calculate sends it as satoshi)
        // update errorMessage values (reserve)
        Object.keys(resultLevels).forEach(key => {
            const tx = resultLevels[key];
            if (tx.type !== 'error' && tx.max) {
                tx.max = formatNetworkAmount(tx.max, account.symbol);
            }
            if (
                tx.type === 'error' &&
                tx.error === 'AMOUNT_IS_LESS_THAN_RESERVE' &&
                requiredAmount
            ) {
                tx.errorMessage = {
                    id: 'AMOUNT_IS_LESS_THAN_RESERVE',
                    values: {
                        reserve: formatNetworkAmount(requiredAmount.toString(), account.symbol),
                    },
                };
            }
        });

        return resultLevels;
    },
);

export const signRippleSendFormTransactionThunk = createThunk<
    { serializedTx: string },
    SignTransactionThunkArguments,
    { rejectValue: SignTransactionError }
>(
    `${SEND_MODULE_PREFIX}/signRippleSendFormTransactionThunk`,
    async (
        { formState, precomposedTransaction, selectedAccount, device },
        { getState, extra, rejectWithValue },
    ) => {
        const {
            selectors: { selectAddressDisplayType },
        } = extra;

        const addressDisplayType = selectAddressDisplayType(getState());

        if (selectedAccount.networkType !== 'ripple')
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Invalid network type.',
            });

        const payment: RipplePayment = {
            destination: formState.outputs[0].address,
            amount: networkAmountWithDecimals(formState.outputs[0].amount, selectedAccount.symbol),
        };

        if (formState.rippleDestinationTag) {
            payment.destinationTag = parseInt(formState.rippleDestinationTag, 10);
        }

        const response = await TrezorConnect.rippleSignTransaction({
            device: {
                path: device.path,
                instance: device.instance,
                state: device.state,
            },
            useEmptyPassphrase: device.useEmptyPassphrase,
            path: selectedAccount.path,
            transaction: {
                fee: precomposedTransaction.feePerByte,
                flags: XRP_FLAG,
                sequence: selectedAccount.misc.sequence,
                payment,
            },
            chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
        });

        if (!response.success) {
            // catch manual error from TransactionReviewModal
            return rejectWithValue({
                error: 'sign-transaction-failed',
                errorCode: response.payload.code,
                message: response.payload.error,
            });
        }

        return { serializedTx: response.payload.serializedTx };
    },
);
