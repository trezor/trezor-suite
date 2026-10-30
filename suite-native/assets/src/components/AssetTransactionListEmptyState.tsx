import { ListItemSkeleton, VStack } from '@suite-native/atoms';
import { TransactionsEmptyState } from '@suite-native/transactions';

type AssetTransactionListEmptyStateProps = {
    isLoading: boolean;
    isDeferred: boolean;
    isRecentWindowEmpty: boolean;
};

export const AssetTransactionListEmptyState = ({
    isLoading,
    isDeferred,
    isRecentWindowEmpty,
}: AssetTransactionListEmptyStateProps) => {
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

    return <TransactionsEmptyState isRecentWindowEmpty={isRecentWindowEmpty} />;
};
