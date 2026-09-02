import { createThunk } from '@suite-common/redux-utils';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import {
    AddressDisplayOptions,
    type ExternalOutput,
    type PrecomposedLevels,
    type PrecomposedTransaction,
} from '@suite-common/wallet-types';
import {
    asAmountUnit,
    calculateMax,
    calculateTotal,
    formatNetworkAmount,
    getExternalComposeOutput,
    isTestnet,
    networkAmountToSmallestUnit,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
import TrezorConnect, { type FeeLevel, type RipplePayment, type TokenInfo } from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';
import { XRP_FLAG } from '@trezor/network-ripple/constants';
import stellar from '@trezor/network-stellar/runtime';
import { StellarAssetType } from '@trezor/protobuf/src/definitions';
import { BigNumber } from '@trezor/utils';

import { SEND_MODULE_PREFIX } from './sendFormConstants';
import {
    type ComposeFeeLevelsError,
    type ComposeTransactionThunkArguments,
    type SignTransactionError,
    type SignTransactionThunkArguments,
} from './sendFormTypes';
import {
    type WalletSettingsRootState,
    selectAddressDisplayType,
} from '../settings/walletSettingsReducer';

const calculate = (
    availableBalance: string,
    output: ExternalOutput,
    feeLevel: FeeLevel,
    requiredAmount?: BigNumber,
    token?: TokenInfo, // Only when sending non-native tokens.
): PrecomposedTransaction => {
    const feeInSatoshi = feeLevel.feePerUnit;

    let amount: string;
    let max: string | undefined;
    const availableTokenBalance = token
        ? unitsToSubunits({
              value: asAmountUnit(new BigNumber(token.balance!)),
              decimals: token.decimals,
          }).toString()
        : undefined;
    if (output.type === 'send-max' || output.type === 'send-max-noaddress') {
        max = availableTokenBalance || calculateMax(availableBalance, feeInSatoshi);
        amount = max;
    } else {
        amount = output.amount;
    }

    // Total native asset amount to be sent.
    // If sending a token, we only need to calculate the fee.
    const totalNativeSpent = new BigNumber(calculateTotal(token ? '0' : amount, feeInSatoshi));

    if (totalNativeSpent.isGreaterThan(availableBalance)) {
        const error = token ? 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' : 'AMOUNT_IS_NOT_ENOUGH';

        return {
            type: 'error',
            error,
            errorMessage: { id: error },
        } as const;
    }

    if (requiredAmount?.gt(amount)) {
        return {
            type: 'error',
            error: 'AMOUNT_IS_LESS_THAN_RESERVE',
            // errorMessage declared later
        } as const;
    }

    const payloadData = {
        type: 'nonfinal' as const,
        totalSpent: token ? amount : totalNativeSpent.toString(),
        max,
        token,
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

type ComposeRippleStellarTransactionFeeLevelsThunkState = void;

export const composeRippleStellarTransactionFeeLevelsThunk = createThunk<
    PrecomposedLevels,
    ComposeTransactionThunkArguments,
    {
        rejectValue: ComposeFeeLevelsError;
        state: ComposeRippleStellarTransactionFeeLevelsThunkState;
    }
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

        const { output, tokenInfo } = composeOutputs;
        const { availableBalance } = account;
        const { outputs: composeOutputsList } = formState;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const firstOutput: (typeof composeOutputsList)[number] = composeOutputsList[0];
        const { address } = firstOutput;

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
                coin: asCoinSymbol(account.symbol),
                suppressBackupWarning: true,
            });
            if (accountResponse.success && accountResponse.payload.empty) {
                // TODO(stellar): check if the recipient has a trust line before sending.
                requiredAmount = new BigNumber(accountResponse.payload.misc!.reserve!);
            }
        }

        // wrap response into PrecomposedLevels object where key is a FeeLevel label
        const resultLevels: PrecomposedLevels = {};
        const response = predefinedLevels.map(level =>
            calculate(availableBalance, output, level, requiredAmount, tokenInfo),
        );
        response.forEach((tx, index) => {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const predefinedLevel: (typeof predefinedLevels)[number] = predefinedLevels[index];
            const feeLabel = predefinedLevel.label;
            resultLevels[feeLabel] = tx;
        });

        const hasAtLeastOneValid = response.find(r => r.type !== 'error');
        // there is no valid tx in predefinedLevels and there is no custom level
        if (!hasAtLeastOneValid && !resultLevels.custom) {
            const { minFee } = feeInfo;
            const lastIndex = predefinedLevels.length - 1;
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const lastLevel: (typeof predefinedLevels)[number] = predefinedLevels[lastIndex];
            const lastKnownFee = lastLevel.feePerUnit;
            let maxFee = new BigNumber(lastKnownFee).minus(1);
            // generate custom levels in range from lastKnownFee -1 to feeInfo.minFee (coinInfo in @trezor/connect)
            const customLevels: FeeLevel[] = [];
            while (maxFee.gte(minFee)) {
                customLevels.push({ feePerUnit: maxFee.toString(), label: 'custom', blocks: -1 });
                maxFee = maxFee.minus(1);
            }

            const customLevelsResponse = customLevels.map(level =>
                calculate(availableBalance, output, level, requiredAmount, tokenInfo),
            );

            const customValid = customLevelsResponse.findIndex(r => r.type !== 'error');
            if (customValid >= 0) {
                // @ts-expect-error: indexing with noUncheckedIndexedAccess
                const customResult: (typeof customLevelsResponse)[number] =
                    customLevelsResponse[customValid];
                resultLevels.custom = customResult;
            }
        }

        // format max (calculate sends it as satoshi)
        // update errorMessage values (reserve)
        Object.keys(resultLevels).forEach(key => {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const tx: (typeof resultLevels)[string] = resultLevels[key];
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
            if (tx.type === 'error' && tx.error === 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE') {
                tx.errorMessage = {
                    id: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
                    values: {
                        networkDisplaySymbol: getDisplaySymbol(network.symbol),
                    },
                };
            }
        });

        return resultLevels;
    },
);

type SignRippleStellarSendFormTransactionThunkState = WalletSettingsRootState;

export const signRippleStellarSendFormTransactionThunk = createThunk<
    { serializedTx: string },
    SignTransactionThunkArguments,
    {
        rejectValue: SignTransactionError;
        state: SignRippleStellarSendFormTransactionThunkState;
    }
>(
    `${SEND_MODULE_PREFIX}/signRippleStellarSendFormTransactionThunk`,
    async (
        { formState, precomposedTransaction, selectedAccount, device, paymentRequests },
        { getState, rejectWithValue },
    ) => {
        const addressDisplayType = selectAddressDisplayType(getState());

        let response;

        const { outputs: signOutputs } = formState;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const firstSignOutput: (typeof signOutputs)[number] = signOutputs[0];

        if (selectedAccount.networkType === 'ripple') {
            const payment: RipplePayment = {
                destination: firstSignOutput.address,
                amount: networkAmountToSmallestUnit(firstSignOutput.amount, selectedAccount.symbol),
            };

            if (formState.destinationTag) {
                payment.destinationTag = parseInt(formState.destinationTag, 10);
            }

            response = await TrezorConnect.rippleSignTransaction({
                device: {
                    path: device.path,
                    instance: device.instance,
                    state: device.state,
                    useEmptyPassphrase: device.useEmptyPassphrase,
                },
                path: selectedAccount.path,
                transaction: {
                    fee: precomposedTransaction.feePerByte,
                    flags: XRP_FLAG,
                    sequence: selectedAccount.misc.sequence,
                    payment,
                },
                payment_req: paymentRequests?.[0],
                chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
            });
            if (response.success) {
                return { serializedTx: response.payload.serializedTx };
            }
        } else if (selectedAccount.networkType === 'stellar') {
            const destinationAccount = await TrezorConnect.getAccountInfo({
                descriptor: firstSignOutput.address,
                coin: asCoinSymbol(selectedAccount.symbol),
                suppressBackupWarning: true,
            });

            const destinationActivated =
                destinationAccount.success && !destinationAccount.payload.empty;

            const { token } = precomposedTransaction;
            let asset: { type: StellarAssetType; code?: string; issuer?: string };
            if (token) {
                const tokenContractParts = token.contract.split('-');
                // @ts-expect-error: indexing with noUncheckedIndexedAccess
                const code: string = tokenContractParts[0];
                // @ts-expect-error: indexing with noUncheckedIndexedAccess
                const issuer: string = tokenContractParts[1];
                asset = {
                    type:
                        code.length <= 4 ? StellarAssetType.ALPHANUM4 : StellarAssetType.ALPHANUM12,
                    code,
                    issuer,
                };
            } else {
                asset = { type: StellarAssetType.NATIVE };
            }

            const { buildSendTransaction } = await stellar();

            const testnet = isTestnet(selectedAccount.symbol);
            const transaction = buildSendTransaction({
                descriptor: selectedAccount.descriptor,
                sequence: selectedAccount.misc.stellarSequence,
                fee: precomposedTransaction.feePerByte,
                destinationActivated,
                destination: firstSignOutput.address,
                amount: firstSignOutput.amount,
                asset,
                destinationTag: formState.destinationTag,
                isTestnet: testnet,
            });

            const xdrBase64 = transaction.toXDR();

            response = await TrezorConnect.stellarSignTransaction({
                device: {
                    path: device.path,
                    instance: device.instance,
                    state: device.state,
                    useEmptyPassphrase: device.useEmptyPassphrase,
                },
                payment_req: paymentRequests?.[0],
                path: selectedAccount.path,
                xdrBase64,
                testnet,
            });

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
            errorCode: response.error.code,
            message: response.error.message,
        });
    },
);
