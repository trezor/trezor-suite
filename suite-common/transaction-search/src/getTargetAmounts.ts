import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { formatNetworkAmount, getTargetAmount } from '@suite-common/wallet-utils';

export const getTargetAmounts = (transaction: WalletAccountTransaction) =>
    transaction.targets.length === 0
        ? [formatNetworkAmount(transaction.amount, transaction.symbol)]
        : transaction.targets.flatMap(target => getTargetAmount(target, transaction) || []);
