import { type NetworkConfigDeps } from '@suite-common/networks';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { getTxOperation } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { getTargetAmounts } from './getTargetAmounts';
import { type searchOperators } from './searchOperations';

export const numberSearchFilter = (
    networkConfigDeps: NetworkConfigDeps,
    transaction: WalletAccountTransaction,
    amount: BigNumber,
    operator: (typeof searchOperators)[number],
) => {
    const targetAmounts = getTargetAmounts(networkConfigDeps, transaction);
    const op = getTxOperation(transaction.type);
    if (!op) {
        return false;
    }

    return (
        targetAmounts.filter(targetAmount => {
            let bnTargetAmount = new BigNumber(targetAmount);
            if (op === 'negative') {
                bnTargetAmount = bnTargetAmount.negated();
            }

            switch (operator) {
                case '<':
                    return bnTargetAmount.lte(amount);
                case '>':
                    return bnTargetAmount.gte(amount);
                case '=':
                    return bnTargetAmount.eq(amount);
                case '!=':
                    return !bnTargetAmount.eq(amount);
                default:
                    return false;
            }
        }).length > 0
    );
};
