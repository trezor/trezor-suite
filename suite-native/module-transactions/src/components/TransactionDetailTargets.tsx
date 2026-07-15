import { useMemo } from 'react';

import { type Target } from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
import { getTargetAmountRaw } from '@suite-common/wallet-utils';
import { type TypedTokenTransfer, type WalletAccountTransaction } from '@suite-native/tokens';

import {
    TransactionDetailCryptoAmount,
    TransactionDetailCryptoFiatAmount,
} from './TransactionDetailCryptoAmount';
import { TransactionDetailTargetsSection } from './TransactionDetailTargetsSection';
import {
    TransactionDetailTokenAmount,
    TransactionDetailTokenFiatAmount,
} from './TransactionDetailTokenAmount';

type TransactionDetailTargetsProps = {
    targets: Target[];
    transaction: WalletAccountTransaction;
    selectedTokenContract?: TokenAddress;
    iconComponent: React.ReactNode;
};

// Pick the single target whose amount the summary should display. A selected token (the
// token-detail view) takes precedence, then the first regular target carrying an amount,
// then an internal transfer.
const findRelevantTarget = (
    targets: Target[],
    transaction: WalletAccountTransaction,
    selectedTokenContract?: TokenAddress,
) => {
    if (selectedTokenContract) {
        const tokenTarget = targets.find(
            target => target.type === 'token' && target.payload.contract === selectedTokenContract,
        );

        if (tokenTarget) {
            return tokenTarget;
        }
    }

    const targetWithAmount = targets.find(
        target => target.type === 'target' && getTargetAmountRaw(target.payload, transaction),
    );

    if (targetWithAmount) {
        return targetWithAmount;
    }

    return targets.find(target => target.type === 'internal') ?? null;
};

const getTargetSlots = (
    targets: Target[],
    transaction: WalletAccountTransaction,
    selectedTokenContract?: TokenAddress,
) => {
    const emptySlots = { topTarget: null, bottomTarget: null };
    const target = findRelevantTarget(targets, transaction, selectedTokenContract);

    if (!target) {
        return emptySlots;
    }

    switch (target.type) {
        case 'token': {
            const tokenTransfer = target.payload as TypedTokenTransfer;

            return {
                topTarget: (
                    <TransactionDetailTokenAmount
                        tokenTransfer={tokenTransfer}
                        transaction={transaction}
                    />
                ),
                bottomTarget: (
                    <TransactionDetailTokenFiatAmount
                        tokenTransfer={tokenTransfer}
                        transaction={transaction}
                    />
                ),
            };
        }
        case 'target': {
            const amount = getTargetAmountRaw(target.payload, transaction);

            if (!amount) {
                return emptySlots;
            }

            return {
                topTarget: (
                    <TransactionDetailCryptoAmount
                        amount={amount.toString()}
                        transaction={transaction}
                    />
                ),
                bottomTarget: (
                    <TransactionDetailCryptoFiatAmount
                        amount={amount.toString()}
                        transaction={transaction}
                    />
                ),
            };
        }
        case 'internal':
            return {
                topTarget: (
                    <TransactionDetailCryptoAmount
                        amount={target.payload.amount}
                        transaction={transaction}
                    />
                ),
                bottomTarget: (
                    <TransactionDetailCryptoFiatAmount
                        amount={target.payload.amount}
                        transaction={transaction}
                    />
                ),
            };
        default:
            return emptySlots;
    }
};

export const TransactionDetailTargets = ({
    targets,
    transaction,
    selectedTokenContract,
    iconComponent,
}: TransactionDetailTargetsProps) => {
    const { topTarget, bottomTarget } = useMemo(
        () => getTargetSlots(targets, transaction, selectedTokenContract),
        [targets, transaction, selectedTokenContract],
    );

    return (
        <TransactionDetailTargetsSection
            topTarget={topTarget}
            bottomTarget={bottomTarget}
            icon={iconComponent}
        />
    );
};
