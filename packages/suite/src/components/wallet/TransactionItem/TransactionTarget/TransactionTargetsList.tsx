import { type Target } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';

import { type WalletAccountTransaction } from 'src/types/wallet';

import { TransactionTarget } from './TransactionTarget';

type TransactionTargetsListProps = {
    transaction: WalletAccountTransaction;
    allOutputs: Target[];
    limit: number;
    defaultLimit: number;
    accountKey: AccountKey;
    isActionDisabled?: boolean;
    isPhishingTransaction?: boolean;
};

export const TransactionTargetsList = ({
    transaction,
    allOutputs,
    limit,
    defaultLimit,
    accountKey,
    isActionDisabled,
    isPhishingTransaction,
}: TransactionTargetsListProps) => {
    const previewTargets = allOutputs.slice(0, defaultLimit);

    const renderTarget = ({ target, i }: { target: Target; i: number }) => {
        const commonProps = {
            ...target,
            transaction,
            accountKey,
            isActionDisabled,
            isPhishingTransaction,
        };

        return <TransactionTarget key={i} {...commonProps} />;
    };

    return (
        <>
            {previewTargets.map((target, i) =>
                renderTarget({
                    target,
                    i,
                }),
            )}
            {limit > 0 &&
                allOutputs.slice(defaultLimit, defaultLimit + limit).map((target, i) =>
                    renderTarget({
                        target,
                        i,
                    }),
                )}
        </>
    );
};
