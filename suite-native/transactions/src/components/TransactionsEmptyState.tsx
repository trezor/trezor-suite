import { Box, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { NoTransactionsSvg } from './NoTransactionsSvg';

type TransactionsEmptyStateProps = {
    /** The direct-RPC window is empty while older history is still reachable. */
    isRecentWindowEmpty?: boolean;
};

export const TransactionsEmptyState = ({
    isRecentWindowEmpty = false,
}: TransactionsEmptyStateProps) => (
    <VStack marginHorizontal="sp16" spacing="sp32">
        <Box alignItems="center">
            <NoTransactionsSvg />
            <VStack alignItems="center">
                <Text textAlign="center" variant="headline-sm">
                    <Translation
                        id={
                            isRecentWindowEmpty
                                ? 'transactions.emptyState.recentWindowTitle'
                                : 'transactions.emptyState.title'
                        }
                    />
                </Text>
                <Text textAlign="center" color="contentSecondary">
                    <Translation
                        id={
                            isRecentWindowEmpty
                                ? 'transactions.emptyState.recentWindowSubtitle'
                                : 'transactions.emptyState.subtitle'
                        }
                    />
                </Text>
            </VStack>
        </Box>
    </VStack>
);
