import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type TokenDefinitionsRootState } from '@suite-common/token-definitions';
import {
    type AccountsRootState,
    type FiatRatesRootState,
    type PhishingRootState,
    type TransactionsRootState,
    createTargets,
    getTxStakeType,
    selectAccountByKey,
    selectIsPhishingTransaction,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { EmptyAmountText } from '@suite-native/formatters';
import { type WalletAccountTransaction } from '@suite-native/tokens';

import { groupTargetOutputs } from '../utils';
import { TokenTransferListItem } from './TokenTransferListItem';
import { TransactionListItemContainer } from './TransactionListItemContainer';
import { TransactionTarget } from './TransactionTarget';

type TransactionListItemProps = {
    transaction: WalletAccountTransaction;
    accountKey: AccountKey;
    isFirst?: boolean;
    isLast?: boolean;
};

export const TransactionListItem = ({
    transaction,
    accountKey,
    isFirst = false,
    isLast = false,
}: TransactionListItemProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const { isPhishing: isPhishingTransaction } = useSelector(
        (
            state: TokenDefinitionsRootState &
                TransactionsRootState &
                FiatRatesRootState &
                PhishingRootState,
        ) => selectIsPhishingTransaction(state, transaction.txid, accountKey),
    );

    const hasTokensCount = transaction.tokens.length;

    const firstToken = transaction.tokens[0];

    const allOutputs = useMemo(
        () => (account !== null ? groupTargetOutputs(createTargets({ transaction, account })) : []),
        [transaction, account],
    );

    const stakeOperationType = getTxStakeType(transaction);

    // Self transactions don't change the account balance (only a network fee is paid), so we show
    // an empty amount instead of the redundant/dust output. Staking self-transactions keep theirs.
    if (transaction.type === 'self' && !stakeOperationType)
        return (
            <TransactionListItemContainer
                transaction={transaction}
                transactionType={transaction.type}
                accountKey={accountKey}
                hasTokensCount={hasTokensCount}
                isFirst={isFirst}
                isLast={isLast}
            >
                <EmptyAmountText />
            </TransactionListItemContainer>
        );

    // Any non-self transaction carrying a token transfer is summarized by its token (e.g. an ERC20
    // transfer, or a swap that also moves native coin). The native amount — rent on Solana, swap
    // value on EVM — is dropped here; the detail screen still shows the full breakdown.
    if (firstToken !== undefined)
        return (
            <TokenTransferListItem
                transaction={transaction}
                accountKey={accountKey}
                tokenTransfer={firstToken}
                hasTokensCount={transaction.tokens.length - 1}
                isFirst={isFirst}
                isLast={isLast}
            />
        );

    return (
        <TransactionListItemContainer
            transaction={transaction}
            transactionType={transaction.type}
            stakeOperationType={stakeOperationType}
            accountKey={accountKey}
            hasTokensCount={hasTokensCount}
            isFirst={isFirst}
            isLast={isLast}
        >
            {allOutputs.map((target, i) => (
                <TransactionTarget
                    key={i}
                    accountKey={accountKey}
                    isPhishingTransaction={isPhishingTransaction}
                    transaction={transaction}
                    {...target}
                />
            ))}
        </TransactionListItemContainer>
    );
};

TransactionListItem.displayName = 'TransactionListItem';
