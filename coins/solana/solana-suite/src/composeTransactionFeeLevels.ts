import type {
    ComposeTransactionFeeLevels,
    GetBlockchainBlockInfoBySymbolDep,
} from '@network-module/suite-types';

import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import type {
    Account,
    ComposeActionContext,
    ExternalOutput,
    FormState,
    PrecomposedLevels,
    PrecomposedTransaction,
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
// eslint-disable-next-line import/no-extraneous-dependencies -- Temporary bridge until Solana compose dependencies are moved into the network module.
import { solanaUtils } from '@trezor/blockchain-link-utils';
import { SOL_COMPUTE_UNIT_LIMIT } from '@trezor/coins-solana/constants';
// eslint-disable-next-line import/no-extraneous-dependencies -- Temporary bridge until Solana compose dependencies are moved into the network module.
import TrezorConnect, { type FeeLevel } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

export type CreateComposeSolanaTransactionFeeLevelsDeps = GetBlockchainBlockInfoBySymbolDep;

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

    if (feeInLamports == null) {
        throw new Error('Invalid fee.');
    }

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

    const totalSolSpent = new BigNumber(calculateTotal(token ? '0' : amount, feeInLamports));

    if (totalSolSpent.isGreaterThan(availableBalance)) {
        const error = token ? 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' : 'AMOUNT_IS_NOT_ENOUGH';

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
    if (account.networkType !== 'solana') {
        throw new Error(`Invalid network type. ${account.networkType}`);
    }
}

export const createComposeSolanaTransactionFeeLevels =
    (deps: CreateComposeSolanaTransactionFeeLevelsDeps): ComposeTransactionFeeLevels<string> =>
    async ({ formState, composeContext, isNetworkReserveEnabled = false }) => {
        const typedFormState = formState as FormState;
        const typedComposeContext = composeContext as ComposeActionContext;
        const { account, network, feeInfo } = typedComposeContext;
        const composedOutput = getExternalComposeOutput(typedFormState, account, network);

        if (!composedOutput) {
            return {
                error: 'fee-levels-compose-failed',
                message: 'Unable to prepare compose output.',
            };
        }

        const { output, decimals, tokenInfo } = composedOutput;

        const { blockhash: blockHash, blockHeight: lastValidBlockHeight } =
            deps.getBlockchainBlockInfoBySymbol(account.symbol);

        assertIsSolanaAccount(account);

        if (tokenInfo && !tokenInfo.accounts) {
            return {
                error: 'fee-levels-compose-failed',
                message: 'Token accounts not found.',
            };
        }

        const { outputs: composeOutputsList } = typedFormState;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const firstOutput: (typeof composeOutputsList)[number] = composeOutputsList[0];

        if (typedFormState.setMaxOutputId !== undefined && !firstOutput.amount) {
            if (tokenInfo?.balance) {
                firstOutput.amount = tokenInfo.balance;
            } else {
                firstOutput.amount = convertAmountSubunitsToUnits(
                    (account.misc?.rent ?? 0) + 1,
                    decimals,
                );
            }
        }

        const transaction = await TrezorConnect.solanaComposeTransaction({
            fromAddress: account.descriptor,
            toAddress: firstOutput.address,
            amount: firstOutput.amount,
            token: tokenInfo
                ? {
                      mint: tokenInfo.contract,
                      program: solanaUtils.tokenStandardToTokenProgramName(tokenInfo.standard),
                      decimals: tokenInfo.decimals,
                      accounts: tokenInfo.accounts ?? [],
                  }
                : undefined,
            blockHash,
            lastValidBlockHeight,
            memo: typedFormState.destinationTag || undefined,
            coin: account.symbol,
            identity: getAccountIdentity(account),
            priorityFees: {
                computeUnitPrice: typedFormState.feePerUnit || '1',
                computeUnitLimit: typedFormState.feeLimit || SOL_COMPUTE_UNIT_LIMIT.toString(),
            },
            serializedTx: typedFormState.transactionData,
        });

        if (!transaction.success) {
            return {
                error: 'fee-levels-compose-failed',
                message: transaction.error.message,
            };
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
            const { levels: estimatedFeeLevels } = estimatedFee.payload;
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const feeLevel: (typeof estimatedFeeLevels)[number] = estimatedFeeLevels[0];
            fetchedFee = feeLevel.feePerTx;
            fetchedFeePerUnit = feeLevel.feePerUnit;
            fetchedFeeLimit = feeLevel.feeLimit;
        } else {
            console.warn('Error fetching fee, using default values.', estimatedFee.error.message);
        }

        const levels = fetchedFee ? feeInfo.levels.map(l => ({ ...l })) : feeInfo.levels;
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
                typedComposeContext,
                isNetworkReserveEnabled,
            ),
        );

        response.forEach((tx, index) => {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const predefinedLevel: (typeof predefinedLevels)[number] = predefinedLevels[index];
            const feeLabel = predefinedLevel.label;
            resultLevels[feeLabel] = tx;
        });

        Object.keys(resultLevels).forEach(key => {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const tx: (typeof resultLevels)[string] = resultLevels[key];

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
    };
