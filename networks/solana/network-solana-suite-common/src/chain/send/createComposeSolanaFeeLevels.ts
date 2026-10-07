import { solanaUtils } from '@trezor/blockchain-link-utils';
import type { GetTrezorConnectDep } from '@trezor/connect-common';
import {
    ChainSendError,
    type ComposeFeeLevelsParams,
    type PrecomposedLevels,
    convertAmountSubunitsToUnits,
    getExternalComposeOutput,
    toCoinSymbol,
} from '@trezor/network-module-suite-common-types';
import { SOL_COMPUTE_UNIT_LIMIT } from '@trezor/network-solana/constants';

import { calculateSolanaTransfer } from './calculateSolanaTransfer';
import { type SolanaSendAppDeps, type SolanaSendConfig, readSolanaAccountMisc } from './types';

export type ComposeSolanaFeeLevelsDeps = GetTrezorConnectDep<
    'solanaComposeTransaction' | 'blockchainEstimateFee'
> &
    SolanaSendAppDeps;

export type ComposeSolanaFeeLevelsParams = ComposeFeeLevelsParams & { config: SolanaSendConfig };

export type ComposeSolanaFeeLevels = (
    params: ComposeSolanaFeeLevelsParams,
) => Promise<PrecomposedLevels>;

/**
 * Solana fee levels, priced by the backend for the transaction the draft describes. The fee
 * does not depend on the amount or recipient, so a draft without them is priced with stand-ins.
 */
export const createComposeSolanaFeeLevels =
    (deps: ComposeSolanaFeeLevelsDeps): ComposeSolanaFeeLevels =>
    async ({ account, draft, context, config }) => {
        const { symbol } = account;
        const fail = (message: string) => new ChainSendError('compose-failed', symbol, message);

        const composedOutput = getExternalComposeOutput(draft, account, config);
        if (!composedOutput) throw fail('Unable to prepare compose output.');

        const { output, decimals, tokenInfo } = composedOutput;
        const { blockHash, blockHeight: lastValidBlockHeight } = deps.getSolanaBlockInfo(symbol);
        const rent = readSolanaAccountMisc(account)?.rent ?? 0;

        // invalid token transfer -- should never happen
        if (tokenInfo && !tokenInfo.accounts) throw fail('Token accounts not found.');

        const { outputs: composeOutputsList } = draft;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const firstOutput: (typeof composeOutputsList)[number] = composeOutputsList[0];
        if (draft.setMaxOutputId !== undefined && !firstOutput.amount) {
            if (tokenInfo?.balance) {
                firstOutput.amount = tokenInfo.balance;
            } else {
                // minimal amount for purpose of fee estimation, at least to cover rent + 1 lamport
                firstOutput.amount = convertAmountSubunitsToUnits(rent + 1, decimals);
            }
        }

        const connect = deps.getTrezorConnect();

        // To estimate fees on Solana we need to turn a transaction into a message for which fees are estimated.
        // Since all the values don't have to be filled in the form at the time of this function call, we use dummy values
        // for the estimation, since these values don't affect the final fee.
        // The real transaction is constructed in `sign`, this one is used solely for fee estimation and is never submitted.
        const transaction = await connect.solanaComposeTransaction({
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
            memo: draft.destinationTag || undefined,
            coin: toCoinSymbol(symbol),
            identity: account.deviceState,
            priorityFees: {
                // dummy value so simulation always passes
                computeUnitPrice: draft.feePerUnit || '1',
                computeUnitLimit: draft.feeLimit || SOL_COMPUTE_UNIT_LIMIT.toString(),
            },
            serializedTx: draft.transactionData,
        });

        if (!transaction.success) throw fail(transaction.error.message);

        const estimatedFee = await connect.blockchainEstimateFee({
            coin: toCoinSymbol(symbol),
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
            const { levels: estimatedFeeLevels } = estimatedFee.payload;
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const feeLevel: (typeof estimatedFeeLevels)[number] = estimatedFeeLevels[0];
            fetchedFee = feeLevel.feePerTx;
            fetchedFeePerUnit = feeLevel.feePerUnit;
            fetchedFeeLimit = feeLevel.feeLimit;
        } else {
            // Error fetching fee, fall back on default values defined in `/packages/connect-core/src/data/defaultFeeLevels.ts`
            console.warn('Error fetching fee, using default values.', estimatedFee.error.message);
        }

        const { levels } = context.feeInfo;
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
            calculateSolanaTransfer(
                account.availableBalance,
                output,
                level,
                decimals,
                rent,
                tokenInfo,
                {
                    formattedBalance: account.formattedBalance,
                    isNetworkReserveEnabled: context.isNetworkReserveEnabled ?? false,
                    nativeTokenReserve: config.nativeTokenReserve,
                },
            ),
        );
        response.forEach((tx, index) => {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const predefinedLevel: (typeof predefinedLevels)[number] = predefinedLevels[index];
            const feeLabel = predefinedLevel.label;
            resultLevels[feeLabel] = tx;
        });

        // format max (calculate sends it as lamports)
        // update errorMessage values (symbol)
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
                        networkDisplaySymbol: config.displaySymbol,
                    },
                };
            }
        });

        return resultLevels;
    };
