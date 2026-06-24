import { Box, Loader } from '@suite-native/atoms';

type TransactionsListFooterProps = {
    isLoading: boolean;
};

export const TransactionsListFooter = ({ isLoading }: TransactionsListFooterProps) => {
    if (!isLoading) return null;

    return (
        <Box paddingVertical="sp40">
            <Loader />
        </Box>
    );
};
