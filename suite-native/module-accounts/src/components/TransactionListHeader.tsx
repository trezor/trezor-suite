import React, { memo } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { Box, Button, Divider, Text } from '@suite-native/atoms';
import { AccountKey } from '@suite-common/wallet-types';
import {
    AccountsRootState,
    selectIsTestnetAccount,
    selectHasAccountTransactions,
} from '@suite-common/wallet-core';
import {
    AccountsStackParamList,
    AppTabsParamList,
    AppTabsRoutes,
    SendReceiveStackRoutes,
    TabToStackCompositeNavigationProp,
} from '@suite-native/navigation';

import { AccountDetailGraph } from './AccountDetailGraph';
import { AccountDetailGraphHeader } from './AccountDetailGraphHeader';

type AccountDetailHeaderProps = {
    accountKey: AccountKey;
};

type AccountsNavigationProps = TabToStackCompositeNavigationProp<
    AppTabsParamList,
    AppTabsRoutes.AccountsStack,
    AccountsStackParamList
>;

export const TransactionListHeader = memo(({ accountKey }: AccountDetailHeaderProps) => {
    const navigation = useNavigation<AccountsNavigationProps>();
    const accountHasTransactions = useSelector((state: AccountsRootState) =>
        selectHasAccountTransactions(state, accountKey),
    );
    const isTestnetAccount = useSelector((state: AccountsRootState) =>
        selectIsTestnetAccount(state, accountKey),
    );

    const handleReceive = () => {
        navigation.navigate(AppTabsRoutes.SendReceiveStack, {
            screen: SendReceiveStackRoutes.Receive,
            params: { accountKey },
        });
    };
    return (
        <>
            <AccountDetailGraphHeader accountKey={accountKey} />
            {accountHasTransactions && (
                <>
                    {!isTestnetAccount && <AccountDetailGraph accountKey={accountKey} />}
                    <Box marginBottom="large" paddingHorizontal="medium">
                        <Button iconLeft="receive" size="large" onPress={handleReceive}>
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
