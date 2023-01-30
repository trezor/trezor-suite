import React, { memo } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { Box, Button, Divider, Text } from '@suite-native/atoms';
import { AccountKey } from '@suite-common/wallet-types';
import { AccountsRootState, selectHasAccountTransactions } from '@suite-common/wallet-core';
import {
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';

import { AccountDetailGraph } from './AccountDetailGraph';
import { AccountBalance } from './AccountBalance';

type AccountDetailHeaderProps = {
    accountKey: AccountKey;
};

export const TransactionListHeader = memo(({ accountKey }: AccountDetailHeaderProps) => {
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.ReceiveModal>>();
    const accountHasTransactions = useSelector((state: AccountsRootState) =>
        selectHasAccountTransactions(state, accountKey),
    );

    const handleReceive = () => {
        navigation.navigate(RootStackRoutes.ReceiveModal, { accountKey });
    };

    return (
        <>
            <AccountBalance accountKey={accountKey} />
            {accountHasTransactions && (
                <>
                    <AccountDetailGraph accountKey={accountKey} />
                    <Box marginBottom="large" paddingHorizontal="medium">
                        <Button
                            iconName="receive"
                            iconPosition="left"
                            size="large"
                            onPress={handleReceive}
                        >
                            Receive
                        </Button>
                    </Box>
                    <Divider />
                </>
            )}
            <Box marginTop="extraLarge" marginBottom="medium" marginHorizontal="large">
                <Text variant="titleSmall">Transactions</Text>
            </Box>
        </>
    );
});
