import { createThunk } from '@suite-common/redux-utils';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import { XRP_FLAG } from '@suite-common/wallet-constants';
import {
    AddressDisplayOptions,
    ExternalOutput,
    PrecomposedLevels,
    PrecomposedTransaction,
} from '@suite-common/wallet-types';
import {
    calculateMax,
    calculateTotal,
    formatNetworkAmount,
    getExternalComposeOutput,
    isTestnet,
    networkAmountToSmallestUnit,
} from '@suite-common/wallet-utils';
import { buildSendTransaction, toStroops } from '@trezor/blockchain-link-utils/src/stellar';
import TrezorConnect, { FeeLevel, RipplePayment, StellarOperation } from '@trezor/connect';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import { SEND_MODULE_PREFIX } from './sendFormConstants';
import {
    ComposeFeeLevelsError,
    ComposeTransactionThunkArguments,
    SignTransactionError,
    SignTransactionThunkArguments,
} from './sendFormTypes';

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

export const composeRippleStellarTransactionFeeLevelsThunk = createThunk<
    PrecomposedLevels,
    ComposeTransactionThunkArguments,
    { rejectValue: ComposeFeeLevelsError }
>(
    `${SEND_MODULE_PREFIX}/composeRippleStellarTransactionFeeLevelsThunk`,
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
                        displaySymbol: getDisplaySymbol(account.symbol),
                    },
                };
            }
        });

        return resultLevels;
    },
);

export const signRippleStellarSendFormTransactionThunk = createThunk<
    { serializedTx: string },
    SignTransactionThunkArguments,
    { rejectValue: SignTransactionError }
>(
    `${SEND_MODULE_PREFIX}/signRippleStellarSendFormTransactionThunk`,
    async (
        { formState, precomposedTransaction, selectedAccount, device },
        { getState, extra, rejectWithValue },
    ) => {
        const {
            selectors: { selectAddressDisplayType },
        } = extra;

        const addressDisplayType = selectAddressDisplayType(getState());

        let response;

        if (selectedAccount.networkType === 'ripple') {
            const payment: RipplePayment = {
                destination: formState.outputs[0].address,
                amount: networkAmountToSmallestUnit(
                    formState.outputs[0].amount,
                    selectedAccount.symbol,
                ),
            };

            if (formState.destinationTag) {
                payment.destinationTag = parseInt(formState.destinationTag, 10);
            }

            response = await TrezorConnect.rippleSignTransaction({
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
            if (response.success) {
                return { serializedTx: response.payload.serializedTx };
            }
        } else if (selectedAccount.networkType === 'stellar') {
            const destinationAccount = await TrezorConnect.getAccountInfo({
                descriptor: formState.outputs[0].address,
                coin: selectedAccount.symbol,
                suppressBackupWarning: true,
            });

            const destinationActivated =
                destinationAccount.success && !destinationAccount.payload.empty;

            let operation: StellarOperation;
            if (destinationActivated) {
                operation = {
                    type: 'payment',
                    asset: { code: 'XLM', type: 0 },
                    amount: toStroops(formState.outputs[0].amount).toString(),
                    destination: formState.outputs[0].address,
                };
            } else {
                operation = {
                    type: 'createAccount',
                    startingBalance: toStroops(formState.outputs[0].amount).toString(),
                    destination: formState.outputs[0].address,
                };
            }

            const transaction = buildSendTransaction(
                selectedAccount.descriptor,
                selectedAccount.misc.stellarSequence,
                precomposedTransaction.feePerByte,
                destinationActivated,
                formState.outputs[0].address,
                formState.outputs[0].amount,
                formState.destinationTag,
                isTestnet(selectedAccount.symbol),
            );

            // It would be better if we could use `@trezor/connect-plugin-stellar`.
            // const transformedTransaction = transformTransaction(selectedAccount.path, transaction);
            const transformedTransaction = {
                device: {
                    path: device.path,
                    instance: device.instance,
                    state: device.state,
                },
                useEmptyPassphrase: device.useEmptyPassphrase,
                path: selectedAccount.path,
                networkPassphrase: transaction.networkPassphrase,
                transaction: {
                    source: transaction.source,
                    fee: Number.parseInt(transaction.fee, 10),
                    sequence: transaction.sequence,
                    memo: formState.destinationTag
                        ? { type: 1, text: formState.destinationTag }
                        : { type: 0 },
                    timebounds: {
                        minTime: 0,
                        maxTime: 0,
                    },
                    operations: [operation],
                },
                chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
            };
            response = await TrezorConnect.stellarSignTransaction(transformedTransaction);

            if (response.success) {
                const signature = Buffer.from(response.payload.signature, 'hex').toString('base64');
                transaction.addSignature(selectedAccount.descriptor, signature);

                return { serializedTx: transaction.toEnvelope().toXDR('hex') };
            }
        } else {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Invalid network type.',
            });
        }

        // catch manual error from TransactionReviewModal
        return rejectWithValue({
            error: 'sign-transaction-failed',
            errorCode: response.payload.code,
            message: response.payload.error,
        });
    },
);
