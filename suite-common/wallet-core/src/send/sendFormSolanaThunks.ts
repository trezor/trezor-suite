import { createThunk } from '@suite-common/redux-utils';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { SOL_COMPUTE_UNIT_LIMIT } from '@suite-common/wallet-constants';
import {
    type Account,
    type ComposeActionContext,
    type ExternalOutput,
    type PrecomposedLevels,
    type PrecomposedTransaction,
} from '@suite-common/wallet-types';
import {
    asAmountSubunit,
    asAmountUnit,
    calculateMax,
    calculateTotal,
    convertAmountSubunitsToUnits,
    convertAmountUnitsToSubunits,
    getAccountIdentity,
    getCryptoMaxAmountWithReserve,
    getExternalComposeOutput,
    subunitsToUnits,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
import type { TokenInfo } from '@trezor/blockchain-link-types';
import { tokenStandardToTokenProgramName } from '@trezor/blockchain-link-utils/src/solana';
import TrezorConnect, { type FeeLevel } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import { SEND_MODULE_PREFIX } from './sendFormConstants';
import {
    type ComposeFeeLevelsError,
    type ComposeTransactionThunkArguments,
    type SignTransactionError,
    type SignTransactionThunkArguments,
} from './sendFormTypes';
import { selectBlockchainBlockInfoBySymbol } from '../blockchain/blockchainReducer';

const calculate = (
    availableBalance: string,
    output: ExternalOutput,
    feeLevel: FeeLevel,
    decimals: number,
    rent: number,
    token?: TokenInfo,
    composeContext?: ComposeActionContext,
    isNetworkReserveEnabled = false,
): PrecomposedTransaction => {
    const feeInLamports = feeLevel.feePerTx;
    if (feeInLamports == null) throw new Error('Invalid fee.');

    let amount: string;
    let max: string | undefined;
    const availableTokenBalance = token
        ? convertAmountUnitsToSubunits(token.balance!, token.decimals)
        : undefined;
    if (output.type === 'send-max' || output.type === 'send-max-noaddress') {
        max = availableTokenBalance || calculateMax(availableBalance, feeInLamports);

        if (composeContext) {
            const feesInUnits = subunitsToUnits({
                value: asAmountSubunit(new BigNumber(feeInLamports)),
                symbol: composeContext.account.symbol,
            }).toString();

            const maxInUnits = subunitsToUnits({
                value: asAmountSubunit(new BigNumber(max)),
                symbol: composeContext.account.symbol,
            }).toString();

            max = getCryptoMaxAmountWithReserve({
                symbol: composeContext.account.symbol,
                contractAddress: token?.contract,
                balance: composeContext.account.formattedBalance,
                amount: maxInUnits,
                fee: feesInUnits,
                isNetworkReserveEnabled,
            });

            max = unitsToSubunits({
                value: asAmountUnit(new BigNumber(max)),
                symbol: composeContext.account.symbol,
            }).toString();
        }

        amount = max;
    } else {
        amount = output.amount;
    }

    // total SOL spent (amount + fee), in case of SPL token only the fee
    const totalSolSpent = new BigNumber(calculateTotal(token ? '0' : amount, feeInLamports));

    if (totalSolSpent.isGreaterThan(availableBalance)) {
        const error = token ? 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' : 'AMOUNT_IS_NOT_ENOUGH';

        // errorMessage declared later
        return { type: 'error', error, errorMessage: { id: error } } as const;
    }
    const remainingSolBalance = new BigNumber(availableBalance).minus(totalSolSpent);

    if (remainingSolBalance.isLessThan(rent) && remainingSolBalance.isGreaterThan(0)) {
        const errorMessage = {
            id: 'REMAINING_BALANCE_LESS_THAN_RENT' as const,
            values: {
                remainingSolBalance: convertAmountSubunitsToUnits(remainingSolBalance, decimals),
                rent: convertAmountSubunitsToUnits(rent, decimals),
            },
        };

        return { type: 'error', error: errorMessage.id, errorMessage } as const;
    }

    const payloadData: PrecomposedTransaction = {
        type: 'nonfinal',
        totalSpent: token ? amount : totalSolSpent.toString(),
        max,
        fee: feeInLamports,
        feePerByte: feeLevel.feePerUnit,
        feeLimit: feeLevel.feeLimit,
        token,
        bytes: 0,
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

    if (output.type === 'payment-noaddress') {
        return {
            ...payloadData,
            type: 'final',
            inputs: [],
            outputsPermutation: [0],
            outputs: [],
        };
    }

    return payloadData;
};

function assertIsSolanaAccount(
    account: Account,
): asserts account is Extract<Account, { networkType: 'solana' }> {
    if (account.networkType !== 'solana')
        throw new Error(`Invalid network type. ${account.networkType}`);
}

export const composeSolanaTransactionFeeLevelsThunk = createThunk<
    PrecomposedLevels,
    ComposeTransactionThunkArguments,
    { rejectValue: ComposeFeeLevelsError }
>(
    `${SEND_MODULE_PREFIX}/composeSolanaTransactionFeeLevelsThunk`,
    async (
        { formState, composeContext, isNetworkReserveEnabled = false },
        { getState, rejectWithValue },
    ) => {
        const { account, network, feeInfo } = composeContext;
        const composedOutput = getExternalComposeOutput(formState, account, network);
        if (!composedOutput)
            return rejectWithValue({
                error: 'fee-levels-compose-failed',
                message: 'Unable to prepare compose output.',
            });

        const { output, decimals, tokenInfo } = composedOutput;

        const { blockhash: blockHash, blockHeight: lastValidBlockHeight } =
            selectBlockchainBlockInfoBySymbol(getState(), account.symbol);

        assertIsSolanaAccount(account);

        // invalid token transfer -- should never happen
        if (tokenInfo && !tokenInfo.accounts)
            return rejectWithValue({
                error: 'fee-levels-compose-failed',
                message: 'Token accounts not found.',
            });

        if (formState.setMaxOutputId !== undefined && !formState.outputs[0].amount) {
            if (tokenInfo?.balance) {
                formState.outputs[0].amount = tokenInfo.balance;
            } else {
                // minimal amount for purpose of fee estimation, at least to cover rent + 1 lamport
                formState.outputs[0].amount = convertAmountSubunitsToUnits(
                    (account.misc?.rent ?? 0) + 1,
                    decimals,
                );
            }
        }

        // To estimate fees on Solana we need to turn a transaction into a message for which fees are estimated.
        // Since all the values don't have to be filled in the form at the time of this function call, we use dummy values
        // for the estimation, since these values don't affect the final fee.
        // The real transaction is constructed in `signTransaction`, this one is used solely for fee estimation and is never submitted.
        const transaction = await TrezorConnect.solanaComposeTransaction({
            fromAddress: account.descriptor,
            toAddress: formState.outputs[0].address,
            amount: formState.outputs[0].amount,
            token: tokenInfo
                ? {
                      mint: tokenInfo.contract,
                      program: tokenStandardToTokenProgramName(tokenInfo.standard),
                      decimals: tokenInfo.decimals,
                      accounts: tokenInfo.accounts ?? [],
                  }
                : undefined,
            blockHash,
            lastValidBlockHeight,
            memo: formState.destinationTag || undefined,
            coin: account.symbol,
            identity: getAccountIdentity(account),
            priorityFees: {
                // dummy value so simulation always passes
                computeUnitPrice: formState.feePerUnit || '1',
                computeUnitLimit: formState.feeLimit || SOL_COMPUTE_UNIT_LIMIT.toString(),
            },
            serializedTx: formState.transactionData,
        });

        if (!transaction.success) {
            return rejectWithValue({
                error: 'fee-levels-compose-failed',
                message: transaction.error.message,
            });
        }

        const estimatedFee = await TrezorConnect.blockchainEstimateFee({
            coin: account.symbol,
            request: {
                specific: {
                    data: transaction.payload.serializedTx,
                    newAccountProgramName: transaction.payload.additionalInfo.newAccountProgramName,
                },
            },
        });

        let fetchedFee: string | undefined;
        let fetchedFeePerUnit: string | undefined;
        let fetchedFeeLimit: string | undefined;
        if (estimatedFee.success) {
            // We access the array directly like this because the fee response from the solana worker always returns an array of size 1
            const feeLevel = estimatedFee.payload.levels[0];
            fetchedFee = feeLevel.feePerTx;
            fetchedFeePerUnit = feeLevel.feePerUnit;
            fetchedFeeLimit = feeLevel.feeLimit;
        } else {
            // Error fetching fee, fall back on default values defined in `/packages/connect/src/data/defaultFeeLevels.ts`
            console.warn('Error fetching fee, using default values.', estimatedFee.error.message);
        }

        // FeeLevels are read-only, so we create a copy if need be
        const levels = fetchedFee ? feeInfo.levels.map(l => ({ ...l })) : feeInfo.levels;
        // update predefined levels with fee fetched from network
        const predefinedLevels = levels
            .filter(l => l.label !== 'custom')
            .map(l => ({
                ...l,
                feePerTx: fetchedFee || l.feePerTx,
                feePerUnit: fetchedFeePerUnit || l.feePerUnit,
                feeLimit: fetchedFeeLimit || l.feeLimit,
            }));

        const resultLevels: PrecomposedLevels = {};

        const response = predefinedLevels.map(level =>
            calculate(
                account.availableBalance,
                output,
                level,
                decimals,
                account.misc?.rent ?? 0,
                tokenInfo,
                composeContext,
                isNetworkReserveEnabled,
            ),
        );
        response.forEach((tx, index) => {
            const feeLabel = predefinedLevels[index].label as FeeLevel['label'];
            resultLevels[feeLabel] = tx;
        });

        // format max (calculate sends it as lamports)
        // update errorMessage values (symbol)
        Object.keys(resultLevels).forEach(key => {
            const tx = resultLevels[key];
            if (tx.type !== 'error') {
                tx.max = tx.max ? convertAmountSubunitsToUnits(tx.max, decimals) : undefined;
            }
            if (tx.type === 'error' && tx.error === 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE') {
                tx.errorMessage = {
                    id: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
                    values: {
                        networkDisplaySymbol: getNetworkDisplaySymbol(network.symbol),
                    },
                };
            }
        });

        return resultLevels;
    },
);

export const signSolanaSendFormTransactionThunk = createThunk<
    { serializedTx: string },
    SignTransactionThunkArguments,
    { rejectValue: SignTransactionError }
>(
    `${SEND_MODULE_PREFIX}/signSolanaSendFormTransactionThunk`,
    async (
        { formState, precomposedTransaction, selectedAccount, device, paymentRequests },
        { rejectWithValue },
    ) => {
        if (precomposedTransaction.feeLimit == null)
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Fee limit missing.',
            });

        if (selectedAccount.networkType !== 'solana')
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Invalid network type.',
            });
        const { token } = precomposedTransaction;

        const blockchainInfo = await TrezorConnect.blockchainGetInfo({
            coin: selectedAccount.symbol,
            identity: getAccountIdentity(selectedAccount),
        });
        if (!blockchainInfo.success) {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Failed to fetch blockchain info.',
            });
        }
        const { blockHash, blockHeight: lastValidBlockHeight } = blockchainInfo.payload;

        if (token && !token.accounts)
            rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Missing token accounts.',
            });

        const transaction = await TrezorConnect.solanaComposeTransaction({
            fromAddress: selectedAccount.descriptor,
            toAddress: formState.outputs[0].address,
            amount: formState.outputs[0].amount,
            token: token
                ? {
                      mint: token.contract,
                      program: tokenStandardToTokenProgramName(token.standard),
                      decimals: token.decimals,
                      accounts: token.accounts ?? [],
                  }
                : undefined,
            blockHash,
            lastValidBlockHeight,
            memo: formState.destinationTag || undefined,
            priorityFees: {
                computeUnitPrice: precomposedTransaction.feePerByte,
                computeUnitLimit: precomposedTransaction.feeLimit,
            },
            coin: selectedAccount.symbol,
            identity: getAccountIdentity(selectedAccount),
            serializedTx: formState.transactionData,
        });

        if (!transaction.success) {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: transaction.error.message,
            });
        }

        const payment_req = paymentRequests?.[0] ?? undefined;

        const response = await TrezorConnect.solanaSignTransaction({
            device: {
                path: device.path,
                instance: device.instance,
                state: device.state,
                useEmptyPassphrase: device.useEmptyPassphrase,
            },
            path: selectedAccount.path,
            serializedTx: transaction.payload.serializedTx,
            payment_req,
            serialize: true,
            additionalInfo: transaction.payload.additionalInfo.tokenAccountInfo
                ? {
                      tokenAccountsInfos: [transaction.payload.additionalInfo.tokenAccountInfo],
                  }
                : undefined,
        });

        if (!response.success) {
            // catch manual error from TransactionReviewModal
            return rejectWithValue({
                error: 'sign-transaction-failed',
                errorCode: response.error.code,
                message: response.error.message,
            });
        }

        return { serializedTx: response.payload.serializedTx! };
    },
);
