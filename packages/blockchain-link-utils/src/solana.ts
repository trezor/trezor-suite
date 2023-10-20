import { ParsedTransactionWithMeta } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
export function extractAccountBalanceDiff(
    transaction: ParsedTransactionWithMeta,
    address: string,
): {
    preBalance: BigNumber;
    postBalance: BigNumber;
} | null {
    const pubKeyIndex = transaction.transaction.message.accountKeys.findIndex(
        ak => ak.pubkey.toString() === address,
    );

    if (pubKeyIndex === -1) {
        return null;
    }

    return {
        preBalance: new BigNumber(transaction.meta?.preBalances[pubKeyIndex] ?? 0),
        postBalance: new BigNumber(transaction.meta?.postBalances[pubKeyIndex] ?? 0),
    };
}
type TransactionEffect = {
    address: string;
    amount: BigNumber;
};

export function getTransactionEffects(transaction: ParsedTransactionWithMeta): TransactionEffect[] {
    return transaction.transaction.message.accountKeys
        .map(ak => {
            const targetAddress = ak.pubkey.toString();
            const balanceDiff = extractAccountBalanceDiff(transaction, targetAddress);
            if (!balanceDiff) {
                return null;
            }

            return {
                address: targetAddress,
                amount: balanceDiff.postBalance.minus(balanceDiff.preBalance),
            };
        })
        .filter((effect): effect is TransactionEffect => !!effect)
        .filter(({ amount }) => !amount.isZero()); // filter out zero effects
}

