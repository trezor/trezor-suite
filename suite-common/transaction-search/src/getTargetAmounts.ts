import { type NetworkConfigDeps } from '@suite-common/networks';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { formatNetworkAmount, getTargetAmount } from '@suite-common/wallet-utils';

export const getTargetAmounts = (
    networkConfigDeps: NetworkConfigDeps,
    transaction: WalletAccountTransaction,
) => {
    const targets = transaction.targets ?? [];

    return targets.length === 0
        ? [formatNetworkAmount(networkConfigDeps, transaction.amount, transaction.symbol)]
        : targets.flatMap(target => getTargetAmount(networkConfigDeps, target, transaction) || []);
};
