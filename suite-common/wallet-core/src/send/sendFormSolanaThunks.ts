import { BigNumber } from '@trezor/utils/src/bigNumber';
import TrezorConnect, { FeeLevel } from '@trezor/connect';
import type { TokenInfo } from '@trezor/blockchain-link-types';
import { tokenStandardToTokenProgramName } from '@trezor/blockchain-link-utils/src/solana';
import {
    ExternalOutput,
    PrecomposedTransaction,
    PrecomposedLevels,
    Account,
} from '@suite-common/wallet-types';
import { createThunk } from '@suite-common/redux-utils';
import {
    amountToSmallestUnit,
    calculateMax,
    calculateTotal,
    formatAmount,
    getAccountIdentity,
    getExternalComposeOutput,
} from '@suite-common/wallet-utils';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';

import { selectBlockchainBlockInfoBySymbol } from '../blockchain/blockchainReducer';
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
    decimals: number,
    rent: number,
    token?: TokenInfo,
): PrecomposedTransaction => {
    const feeInLamports = feeLevel.feePerTx;
    if (feeInLamports == null) throw new Error('Invalid fee.');

    let amount: string;
    let max: string | undefined;
    const availableTokenBalance = token
        ? amountToSmallestUnit(token.balance!, token.decimals)
        : undefined;
    if (output.type === 'send-max' || output.type === 'send-max-noaddress') {
        max = availableTokenBalance || calculateMax(availableBalance, feeInLamports);
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
                remainingSolBalance: formatAmount(remainingSolBalance, decimals),
                rent: formatAmount(rent, decimals),
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
    async ({ formState, composeContext }, { getState, rejectWithValue }) => {
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
                // small amount for purpose of fee estimation
                formState.outputs[0].amount = '0.000000001';
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
                      program: tokenStandardToTokenProgramName(tokenInfo.type),
                      decimals: tokenInfo.decimals,
                      accounts: tokenInfo.accounts ?? [],
                  }
                : undefined,
            blockHash,
            lastValidBlockHeight,
            coin: account.symbol,
            identity: getAccountIdentity(account),
        });

        if (!transaction.success) {
            return rejectWithValue({
                error: 'fee-levels-compose-failed',
                message: transaction.payload.error,
            });
        }

        const estimatedFee = await TrezorConnect.blockchainEstimateFee({
            coin: account.symbol,
            request: {
                specific: {
                    data: transaction.payload.serializedTx,
                    isCreatingAccount: transaction.payload.additionalInfo.isCreatingAccount,
                    newTokenAccountProgramName:
                        transaction.payload.additionalInfo.newTokenAccountProgramName,
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
            console.warn('Error fetching fee, using default values.', estimatedFee.payload.error);
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

        assertIsSolanaAccount(account);

        const response = predefinedLevels.map(level =>
            calculate(
                account.availableBalance,
                output,
                level,
                decimals,
                account.misc.rent ?? 0,
                tokenInfo,
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
                tx.max = tx.max ? formatAmount(tx.max, decimals) : undefined;
            }
            if (tx.type === 'error' && tx.error === 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE') {
                tx.errorMessage = {
                    id: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
                    values: {
                        networkSymbol: getNetworkDisplaySymbol(network.symbol),
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
    async ({ formState, precomposedTransaction, selectedAccount, device }, { rejectWithValue }) => {
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
                      program: tokenStandardToTokenProgramName(token.type),
                      decimals: token.decimals,
                      accounts: token.accounts ?? [],
                  }
                : undefined,
            blockHash,
            lastValidBlockHeight,
            priorityFees: {
                computeUnitPrice: precomposedTransaction.feePerByte,
                computeUnitLimit: precomposedTransaction.feeLimit,
            },
            coin: selectedAccount.symbol,
            identity: getAccountIdentity(selectedAccount),
        });

        if (!transaction.success) {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: transaction.payload.error,
            });
        }

        const response = await TrezorConnect.solanaSignTransaction({
            device: {
                path: device.path,
                instance: device.instance,
                state: device.state,
            },
            useEmptyPassphrase: device.useEmptyPassphrase,
            path: selectedAccount.path,
            serializedTx: transaction.payload.serializedTx,
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
                errorCode: response.payload.code,
                message: response.payload.error,
            });
        }

        return { serializedTx: response.payload.serializedTx! };
    },
);
