import { type ReactNode } from 'react';

import { Box, Button, Loader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type TransactionsListFooterProps = {
    hasMoreTransactions: boolean;
    isOlderHistory: boolean;
    isLoading: boolean;
    onButtonPress: () => void;
    /** Rendered above the button. */
    children?: ReactNode;
};

export const TransactionsListFooter = ({
    hasMoreTransactions,
    isOlderHistory,
    isLoading,
    onButtonPress,
    children,
}: TransactionsListFooterProps) => {
    if (isLoading) {
        return (
            <Box paddingVertical="sp40">
                <Loader />
            </Box>
        );
    }

    if (!hasMoreTransactions) {
        return null;
    }

    return (
        <Box paddingTop="sp32" paddingHorizontal="sp16">
            <VStack spacing="sp12">
                {children}
                <Button
                    intent="neutral"
                    priority="secondary"
                    onPress={onButtonPress}
                    testID="@transactions/list/more-button"
                >
                    <Translation
                        id={isOlderHistory ? 'transactions.loadOlder' : 'transactions.more'}
                    />
                </Button>
            </VStack>
        </Box>
    );
};
