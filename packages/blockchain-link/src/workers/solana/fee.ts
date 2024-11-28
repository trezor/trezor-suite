import {
    Address,
    Base64EncodedWireTransaction,
    CompiledTransactionMessage,
    decompileTransactionMessage,
    getBase64Decoder,
    getCompiledTransactionMessageEncoder,
    GetFeeForMessageApi,
    GetRecentPrioritizationFeesApi,
    getTransactionEncoder,
    isWritableRole,
    pipe,
    Rpc,
    SignaturesMap,
    SimulateTransactionApi,
    TransactionMessageBytes,
    TransactionMessageBytesBase64,
} from '@solana/web3.js';

import { BigNumber } from '@trezor/utils/src/bigNumber';

const COMPUTE_BUDGET_PROGRAM_ID =
    'ComputeBudget111111111111111111111111111111' as Address<'ComputeBudget111111111111111111111111111111'>;
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
    compiledMessage: CompiledTransactionMessage,
    signatures: SignaturesMap,
) => {
    const message = decompileTransactionMessage(compiledMessage);
    const affectedAccounts = new Set<Address>(
        message.instructions
            .flatMap(instruction => instruction.accounts ?? [])
            .filter(({ role }) => isWritableRole(role))
            .map(({ address }) => address),
    );

    // Reconstruct TX for simulation
    const messageBytes = pipe(
        compiledMessage,
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
        .simulateTransaction(rawTx, { commitment: 'confirmed', encoding: 'base64' })
        .send();
    if (simulated.value.err != null || !simulated.value.unitsConsumed) {
        console.error('Could not simulate transaction:', simulated.value.err);
        throw new Error(`Could not simulate transaction: ${simulated.value.err}`);
    }
    // Add 20% margin to the computed limit
    const computeUnitLimit = new BigNumber(simulated.value.unitsConsumed.toString())
        .times(1.2)
        .decimalPlaces(0, BigNumber.ROUND_UP);

    // Local fees from API
    const recentFees = await api.getRecentPrioritizationFees(Array.from(affectedAccounts)).send();

    const networkPriorityFee = recentFees
        .map(a => a.prioritizationFee)
        .sort((a, b) => Number(b - a))[Math.floor(recentFees.length / 4)]; // 25th percentile because many 0 priority fees are expected

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
