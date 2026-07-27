import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { formatNetworkAmount, getTargetAmount } from '@suite-common/wallet-utils';

export const getTargetAmounts = (transaction: WalletAccountTransaction) => {
    const targets = transaction.targets ?? [];

    return targets.length === 0
        ? [formatNetworkAmount(transaction.amount, transaction.symbol)]
        : targets.flatMap(target => getTargetAmount(target, transaction) || []);
};
