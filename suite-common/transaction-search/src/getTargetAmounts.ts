import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { formatNetworkAmount, getTargetAmount } from '@suite-common/wallet-utils';

export const getTargetAmounts = (
    deps: GetNetworkConfigDep,
    transaction: WalletAccountTransaction,
) => {
    const targets = transaction.targets ?? [];

    return targets.length === 0
        ? [formatNetworkAmount(deps, transaction.amount, transaction.symbol)]
        : targets.flatMap(target => getTargetAmount(deps, target, transaction) || []);
};
import type { GetNetworkConfigDep } from '@suite-common/networks';
