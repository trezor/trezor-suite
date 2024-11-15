import { useSelector } from 'react-redux';

import {
    TransactionsRootState,
    selectAreAllAccountTransactionsLoaded,
} from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { Button, Box, Loader } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type TransactionsListFooterProps = {
    accountKey: AccountKey;
    isLoading: boolean;
    onButtonPress: () => void;
};

export const TransactionsListFooter = ({
    accountKey,
    isLoading,

    onButtonPress,
}: TransactionsListFooterProps) => {
    const areAllTxnsFetched = useSelector((state: TransactionsRootState) =>
        selectAreAllAccountTransactionsLoaded(state, accountKey),
    );
    if (isLoading) {
        return (
            <Box paddingVertical="sp40">
                <Loader />
            </Box>
        );
    } else if (!areAllTxnsFetched) {
        return (
            <Box paddingHorizontal="sp16" paddingVertical="sp32">
                <Button
                    colorScheme="tertiaryElevation0"
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
