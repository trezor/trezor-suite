import {
    Address,
    CompiledTransactionMessage,
    decompileTransactionMessage,
    getBase64Decoder,
    getCompiledTransactionMessageEncoder,
    GetFeeForMessageApi,
    GetRecentPrioritizationFeesApi,
    isWritableRole,
    MicroLamports,
    pipe,
    Rpc,
    TransactionMessageBytesBase64,
} from '@solana/web3.js';

import { BigNumber } from '@trezor/utils/src/bigNumber';

const COMPUTE_BUDGET_PROGRAM_ID =
    'ComputeBudget111111111111111111111111111111' as Address<'ComputeBudget111111111111111111111111111111'>;
const DEFAULT_COMPUTE_UNIT_PRICE_MICROLAMPORTS = BigInt(100_000); // micro-lamports, value taken from other wallets
// sending tokens with token account creation requires ~28K units. However we over-reserve for now
// since otherwise the transactions don't seem to go through otherwise. This can perhaps be changed
// if e.g. https://github.com/anza-xyz/agave/pull/187 is merged.
const DEFAULT_COMPUTE_UNIT_LIMIT = BigInt(200_000);

export const getBaseFee = async (
    api: Rpc<GetFeeForMessageApi>,
    message: CompiledTransactionMessage,
) => {
    const messageWithoutComputeBudget = pipe(
        {
            ...message,
            // Remove ComputeBudget instructions from the message when estimating the base fee
            // since the exact priority fees are computed separately and getFeeForMessage also
            // considers priority fees.
            instructions: message.instructions.filter(
                instruction =>
                    message.staticAccounts[instruction.programAddressIndex] !==
                    COMPUTE_BUDGET_PROGRAM_ID,
            ),
        },
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
    api: Rpc<GetRecentPrioritizationFeesApi>,
    compiledMessage: CompiledTransactionMessage,
) => {
    const message = decompileTransactionMessage(compiledMessage);
    const affectedAccounts = new Set<Address>(
        message.instructions
            .flatMap(instruction => instruction.accounts ?? [])
            .filter(({ role }) => isWritableRole(role))
            .map(({ address }) => address),
    );

    const recentFees = await api.getRecentPrioritizationFees(Array.from(affectedAccounts)).send();

    const computeUnitLimit = DEFAULT_COMPUTE_UNIT_LIMIT;

    const networkPriorityFee = recentFees
        .map(a => a.prioritizationFee)
        .sort((a, b) => Number(b - a))[Math.floor(recentFees.length / 4)]; // 25th percentile because many 0 priority fees are expected

    const computeUnitPrice =
        networkPriorityFee > DEFAULT_COMPUTE_UNIT_PRICE_MICROLAMPORTS
            ? networkPriorityFee
            : DEFAULT_COMPUTE_UNIT_PRICE_MICROLAMPORTS;

    const fee = new BigNumber(computeUnitPrice.toString())
        .times(10 ** -6) // microLamports -> Lamports
        .times(computeUnitLimit.toString())
        .decimalPlaces(0, BigNumber.ROUND_UP)
        .toString(10);

    return {
        computeUnitPrice,
        computeUnitLimit,
        fee: BigInt(fee) as MicroLamports,
    };
};
