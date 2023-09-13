import { ParsedTransactionWithMeta } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { Target, Transaction } from '@trezor/blockchain-link-types/lib';

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

export function getTargets(
    effects: TransactionEffect[],
    txType: Transaction['type'],
    accountAddress: string,
): Transaction['targets'] {
    return effects
        .filter(effect => {
            // for 'self` transaction there is only one effect
            if (txType === 'self') {
                return true;
            }
            // ignore all targets for unknown transactions
            if (txType === 'unknown') {
                return false;
            }
            // count in only positive effects, for `sent` tx they gonna be represented as negative, for `recv` as positive
            return effect.amount.isGreaterThan(0);
        })
        .map((effect, i) => {
            const target: Target = {
                n: i,
                addresses: [effect.address],
                isAddress: true,
                amount: effect.amount.abs().toString(),
                isAccountTarget: effect.address === accountAddress && txType !== 'sent',
            };
            return target;
        });
}

export const getTxType = (
    transaction: ParsedTransactionWithMeta,
    effects: TransactionEffect[],
    accountAddress: string,
): Transaction['type'] => {
    if (transaction.meta?.err) {
        return 'failed';
    }

    if (
        effects.length === 1 &&
        effects[0]?.address === accountAddress &&
        effects[0]?.amount.abs().isEqualTo(new BigNumber(transaction.meta?.fee || 0))
    ) {
        return 'self';
    }

    const senders = effects.filter(({ amount }) => amount.isNegative());

    if (senders.find(({ address }) => address === accountAddress)) {
        return 'sent';
    }

    const receivers = effects.filter(({ amount }) => amount.isPositive());

    if (receivers.find(({ address }) => address === accountAddress)) {
        return 'recv';
    }

    return 'unknown';
};

export function getAmount(
    accountEffect: TransactionEffect | undefined,
    txType: Transaction['type'],
) {
    if (!accountEffect) {
        return '0';
    }
    if (txType === 'self') {
        return accountEffect.amount?.abs().toString();
    }
    return accountEffect.amount.toString();
}
