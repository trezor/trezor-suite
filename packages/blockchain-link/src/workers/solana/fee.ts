import { Connection, Message, PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';

const DEFAULT_COMPUTE_UNIT_PRICE = 100_000; // micro-lamports, value taken from other wallets
const DEFAULT_COMPUTE_UNIT_LIMIT = 50_000; // sending tokens with token account creation requires ~28K units

export const getBaseFee = async (api: Connection, message: Message) => {
    const result = await api.getFeeForMessage(message);
    // The result can be null, for example if the transaction blockhash is invalid.
    // In this case, we should fall back to the default fee.
    if (result.value == null) {
        throw new Error('Could not estimate fee for transaction.');
    }

    return result.value;
};

export const getPriorityFee = async (api: Connection, message: Message) => {
    const affectedAccounts = message
        .getAccountKeys()
        .staticAccountKeys.filter((_, i) => message.isAccountWritable(i))
        .map(key => key.toString());

    const recentFees = await api.getRecentPrioritizationFees({
        lockedWritableAccounts: affectedAccounts.map(a => new PublicKey(a)),
    });

    const networkPriorityFee = recentFees.map(a => a.prioritizationFee).sort((a, b) => b - a)[
        Math.floor(recentFees.length / 4)
    ]; // 25th percentile because many 0 priority fees are expected

    const computeUnitPrice = new BigNumber(
        Math.max(networkPriorityFee, DEFAULT_COMPUTE_UNIT_PRICE),
    );

    const fee = computeUnitPrice
        .times(10 ** -6) // microLamports -> Lamports
        .times(DEFAULT_COMPUTE_UNIT_LIMIT)
        .toNumber();

    return { computeUnitPrice, computeUnitLimit: DEFAULT_COMPUTE_UNIT_LIMIT, fee };
};
