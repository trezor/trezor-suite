import {
    type Address,
    type Base64EncodedWireTransaction,
    type CompilableTransactionMessage,
    type CompiledTransactionMessage,
    type GetFeeForMessageApi,
    type GetRecentPrioritizationFeesApi,
    type Rpc,
    type SignaturesMap,
    type SimulateTransactionApi,
    type TransactionMessageBytes,
    type TransactionMessageBytesBase64,
    getBase64Decoder,
    getCompiledTransactionMessageEncoder,
    getTransactionEncoder,
    isWritableRole,
    pipe,
} from '@solana/kit';
import {
    MAX_COMPUTE_UNIT_LIMIT,
    SET_COMPUTE_UNIT_LIMIT_DISCRIMINATOR,
    getSetComputeUnitLimitInstructionDataEncoder,
} from '@solana-program/compute-budget';

import { COMPUTE_BUDGET_PROGRAM_ID } from '@trezor/blockchain-link-utils/src/solana';
import { safeBigIntStringify } from '@trezor/utils';
import { BigNumber } from '@trezor/utils/src/bigNumber';

const DEFAULT_COMPUTE_UNIT_PRICE_MICROLAMPORTS = BigInt(300_000); // micro-lamports, value taken from other wallets

const stripComputeBudgetInstructions = (message: CompiledTransactionMessage) => ({
    ...message,
    // Remove ComputeBudget instructions from the message when estimating the base fee
    // since the exact priority fees are computed separately and getFeeForMessage also
    // considers priority fees.
    instructions: message.instructions.filter(
        instruction =>
            message.staticAccounts[instruction.programAddressIndex] !== COMPUTE_BUDGET_PROGRAM_ID,
    ),
});

// increase compute unit limit to maximum for priority fee simulation
// avoid simulation fail in case instructions are wrong (e.g. from backend)
const bumpUnitLimitComputeBudgetInstructions = (
    message: CompiledTransactionMessage,
): CompiledTransactionMessage => ({
    ...message,
    instructions: message.instructions.map(ix => {
        if (
            message.staticAccounts[ix.programAddressIndex] === COMPUTE_BUDGET_PROGRAM_ID &&
            ix.data?.[0] === SET_COMPUTE_UNIT_LIMIT_DISCRIMINATOR
        ) {
            const data = getSetComputeUnitLimitInstructionDataEncoder().encode({
                units: MAX_COMPUTE_UNIT_LIMIT,
            });

            return { ...ix, data };
        }

        return ix;
    }),
});

export const getBaseFee = async (
    api: Rpc<GetFeeForMessageApi>,
    message: CompiledTransactionMessage,
) => {
    const messageWithoutComputeBudget = pipe(
        stripComputeBudgetInstructions(message),
        getCompiledTransactionMessageEncoder().encode,
        getBase64Decoder().decode,
    ) as TransactionMessageBytesBase64;
    const result = await api.getFeeForMessage(messageWithoutComputeBudget).send();
    // The result can be null, for example if the transaction blockhash is invalid.
    // In this case, we should fall back to the default fee.
    if (result.value == null) {
        throw new Error('Could not estimate fee for transaction.');
    }

    return result.value;
};

// More about Solana priority fees here:
// https://solana.com/developers/guides/advanced/how-to-use-priority-fees#how-do-i-estimate-priority-fees
export const getPriorityFee = async (
    api: Rpc<GetRecentPrioritizationFeesApi & SimulateTransactionApi>,
    decompiledMessage: CompilableTransactionMessage,
    compiledMessage: CompiledTransactionMessage,
    signatures: SignaturesMap,
) => {
    const affectedAccounts = new Set<Address>(
        decompiledMessage.instructions
            .flatMap(instruction => instruction.accounts ?? [])
            .filter(({ role }) => isWritableRole(role))
            .map(({ address }) => address),
    );

    // Reconstruct TX for simulation
    const messageBytes = pipe(
        bumpUnitLimitComputeBudgetInstructions(compiledMessage),
        getCompiledTransactionMessageEncoder().encode,
    ) as TransactionMessageBytes;

    const rawTx = pipe(
        {
            messageBytes,
            signatures,
        },
        getTransactionEncoder().encode,
        getBase64Decoder().decode,
    ) as Base64EncodedWireTransaction;

    const simulated = await api
        .simulateTransaction(rawTx, {
            commitment: 'confirmed',
            encoding: 'base64',
            sigVerify: false,
            replaceRecentBlockhash: true,
        })
        .send();

    if (simulated.value.err != null || simulated.value.unitsConsumed == null) {
        const stringifiedError = safeBigIntStringify(simulated.value.err);

        console.error('Could not simulate transaction:', stringifiedError);
        throw new Error(`Could not simulate transaction: ${stringifiedError}`);
    }

    // Add 20% margin to the computed limit
    const computeUnitLimit = new BigNumber(simulated.value.unitsConsumed.toString())
        .times(1.2)
        .decimalPlaces(0, BigNumber.ROUND_UP);

    // Local fees from API
    const recentFees = await api.getRecentPrioritizationFees(Array.from(affectedAccounts)).send();

    const sortedFees = recentFees.map(a => a.prioritizationFee).sort((a, b) => Number(b - a));
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const networkPriorityFee: (typeof sortedFees)[number] =
        sortedFees[Math.floor(recentFees.length / 4)]; // 25th percentile because many 0 priority fees are expected

    const computeUnitPrice =
        networkPriorityFee > DEFAULT_COMPUTE_UNIT_PRICE_MICROLAMPORTS
            ? networkPriorityFee
            : DEFAULT_COMPUTE_UNIT_PRICE_MICROLAMPORTS;

    const fee = new BigNumber(computeUnitPrice.toString())
        .times(10 ** -6) // microLamports -> Lamports
        .times(computeUnitLimit)
        .decimalPlaces(0, BigNumber.ROUND_UP)
        .toString(10);

    return {
        computeUnitPrice: computeUnitPrice.toString(10),
        computeUnitLimit: computeUnitLimit.toString(10),
        fee,
    };
};
