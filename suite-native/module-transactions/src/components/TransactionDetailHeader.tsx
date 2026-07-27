import { useMemo } from 'react';

import { type Target } from '@suite-common/wallet-core';
import { isPending } from '@suite-common/wallet-utils';
import { Badge, Box, DiscreetTextTrigger } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { type TypedTokenTransfer, type WalletAccountTransaction } from '@suite-native/tokens';
import { TransactionIcon } from '@suite-native/transactions';

import { TransactionDetailTargets } from './TransactionDetailTargets';

type TransactionDetailHeaderProps = {
    transaction: WalletAccountTransaction;
    tokenTransfer?: TypedTokenTransfer;
    allOutputs: Target[];
};

export const TransactionDetailHeader = ({
    transaction,
    tokenTransfer,
    allOutputs,
}: TransactionDetailHeaderProps) => {
    const { type } = transaction;

    const isPendingTx = isPending(transaction);
    const isFailedTx = transaction.type === 'failed';
    const isTokenOnlyTransaction = transaction.amount === '0' && transaction.tokens.length !== 0;

    const firstToken = transaction.tokens[0];
    const txType = isTokenOnlyTransaction && firstToken ? firstToken.type : type;

    const iconComponent = useMemo(
        () => (
            <>
                <TransactionIcon transactionType={txType} isAnimated={isPendingTx} size={48} />

                {isPendingTx ? (
                    <Badge
                        intent="warning"
                        label={<Translation id="transactions.status.pending" />}
                    />
                ) : (
                    !isFailedTx && (
                        <Badge
                            intent="brand"
                            label={<Translation id="transactions.status.confirmed" />}
                        />
                    )
                )}
            </>
        ),
        [txType, isPendingTx, isFailedTx],
    );

    return (
        <DiscreetTextTrigger>
            <Box alignItems="center">
                <TransactionDetailTargets
                    iconComponent={iconComponent}
                    targets={allOutputs}
                    transaction={transaction}
                    selectedTokenContract={tokenTransfer?.contract}
                />
            </Box>
        </DiscreetTextTrigger>
    );
};
