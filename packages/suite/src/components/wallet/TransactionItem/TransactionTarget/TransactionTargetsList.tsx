import { type Target } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';

import { TransactionTarget } from './TransactionTarget';
import { type WalletAccountTransaction } from '../../../../types/wallet';

type TransactionTargetsListProps = {
    transaction: WalletAccountTransaction;
    allOutputs: Target[];
    accountKey: AccountKey;
    isActionDisabled?: boolean;
    isPhishingTransaction?: boolean;
};

export const TransactionTargetsList = ({
    transaction,
    allOutputs,
    accountKey,
    isActionDisabled,
    isPhishingTransaction,
}: TransactionTargetsListProps) => (
    <>
        {allOutputs.map((target, i) => (
            <TransactionTarget
                key={i}
                {...target}
                transaction={transaction}
                accountKey={accountKey}
                isActionDisabled={isActionDisabled}
                isPhishingTransaction={isPhishingTransaction}
            />
        ))}
    </>
);
