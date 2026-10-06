import { Box, Button, Loader } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type TransactionsListFooterProps = {
    hasMoreTransactions: boolean;
    isLoading: boolean;
    onButtonPress: () => void;
};

export const TransactionsListFooter = ({
    hasMoreTransactions,
    isLoading,
    onButtonPress,
}: TransactionsListFooterProps) => {
    if (isLoading) {
        return (
            <Box paddingVertical="sp40">
                <Loader />
            </Box>
        );
    } else if (hasMoreTransactions) {
        return (
            <Box paddingTop="sp32" paddingHorizontal="sp16">
                <Button
                    intent="neutral"
                    priority="secondary"
                    onPress={onButtonPress}
                    testID="@transactions/list/more-button"
                >
                    <Translation id="transactions.more" />
                </Button>
            </Box>
        );
    }

    return null;
};
