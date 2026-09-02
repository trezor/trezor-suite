import { Box, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { NoTransactionsSvg } from './NoTransactionsSvg';

export const TransactionsEmptyState = () => (
    <VStack marginHorizontal="sp16" spacing="sp32">
        <Box alignItems="center">
            <NoTransactionsSvg />
            <VStack alignItems="center">
                <Text textAlign="center" variant="headline-sm">
                    <Translation id="transactions.emptyState.title" />
                </Text>
                <Text textAlign="center" color="contentSecondary">
                    <Translation id="transactions.emptyState.subtitle" />
                </Text>
            </VStack>
        </Box>
    </VStack>
);
