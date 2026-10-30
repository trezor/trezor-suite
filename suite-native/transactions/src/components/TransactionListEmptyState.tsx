import { type JSX } from 'react';

import { ListItemSkeleton, VStack } from '@suite-native/atoms';

import { TransactionsEmptyState } from './TransactionsEmptyState';

type TransactionListEmptyStateProps = {
    isLoading: boolean;
    isDeferred: boolean;
    isRecentWindowEmpty: boolean;
    renderEmptyComponent?: (state: { isRecentWindowEmpty: boolean }) => JSX.Element;
};

export const TransactionListEmptyState = ({
    isLoading,
    isDeferred,
    isRecentWindowEmpty,
    renderEmptyComponent,
}: TransactionListEmptyStateProps) => {
    if (isLoading) {
        return (
            <VStack spacing="sp8">
                <ListItemSkeleton />
                <ListItemSkeleton />
                <ListItemSkeleton />
            </VStack>
        );
    }

    if (isDeferred) {
        return null;
    }

    return (
        renderEmptyComponent?.({ isRecentWindowEmpty }) ?? (
            <TransactionsEmptyState isRecentWindowEmpty={isRecentWindowEmpty} />
        )
    );
};
