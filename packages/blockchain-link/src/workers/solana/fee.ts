import { Connection, Message, PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';

const COMPUTE_BUDGET_PROGRAM_ID = 'ComputeBudget111111111111111111111111111111';
const DEFAULT_COMPUTE_UNIT_PRICE_MICROLAMPORTS = 100_000; // micro-lamports, value taken from other wallets
// sending tokens with token account creation requires ~28K units. However we over-reserve for now
// since otherwise the transactions don't seem to go through otherwise. This can perhaps be changed
// if e.g. https://github.com/anza-xyz/agave/pull/187 is merged.
const DEFAULT_COMPUTE_UNIT_LIMIT = 200_000;

export const getBaseFee = async (api: Connection, message: Message) => {
    // Remove ComputeBudget instructions from the message when estimating the base fee
    // since the exact priority fees are computed separately and getFeeForMessage also
    // considers priority fees.
    const messageWithoutComputeBudget = new Message({
        header: message.header,
        accountKeys: message.accountKeys,
        recentBlockhash: message.recentBlockhash,
        instructions: message.instructions.filter(
            instruction =>
                message.accountKeys[instruction.programIdIndex].toBase58() !==
                COMPUTE_BUDGET_PROGRAM_ID,
        ),
    });
    const result = await api.getFeeForMessage(messageWithoutComputeBudget);
    // The result can be null, for example if the transaction blockhash is invalid.
    // In this case, we should fall back to the default fee.
    if (result.value == null) {
        throw new Error('Could not estimate fee for transaction.');
    }

    return result.value;
};

// More about Solana priority fees here:
// https://solana.com/developers/guides/advanced/how-to-use-priority-fees#how-do-i-estimate-priority-fees
export const getPriorityFee = async (api: Connection, message: Message) => {
    const affectedAccounts = message
        .getAccountKeys()
        .staticAccountKeys.filter((_, i) => message.isAccountWritable(i))
        .map(key => key.toString());

    const recentFees = await api.getRecentPrioritizationFees({
        lockedWritableAccounts: affectedAccounts.map(a => new PublicKey(a)),
    });

    const computeUnitLimit = DEFAULT_COMPUTE_UNIT_LIMIT;

    const networkPriorityFee = recentFees.map(a => a.prioritizationFee).sort((a, b) => b - a)[
        Math.floor(recentFees.length / 4)
    ]; // 25th percentile because many 0 priority fees are expected

    const computeUnitPrice = new BigNumber(
        Math.max(networkPriorityFee, DEFAULT_COMPUTE_UNIT_PRICE_MICROLAMPORTS),
    );

    const fee = computeUnitPrice
        .times(10 ** -6) // microLamports -> Lamports
        .times(computeUnitLimit)
        .decimalPlaces(0, BigNumber.ROUND_UP)
        .toNumber();

    return { computeUnitPrice: computeUnitPrice.toNumber(), computeUnitLimit, fee };
};
