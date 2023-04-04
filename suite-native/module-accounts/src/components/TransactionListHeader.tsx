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
    tokenSymbol?: string;
};

type AccountsNavigationProps = TabToStackCompositeNavigationProp<
    AppTabsParamList,
    AppTabsRoutes.AccountsStack,
    AccountsStackParamList
>;

export const TransactionListHeader = memo(
    ({ accountKey, tokenSymbol }: AccountDetailHeaderProps) => {
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

        const isTokenAccount = !!tokenSymbol;

        return (
            <>
                {/* Graph is temporarily hidden for ERC20 tokens. */}
                {/* Will be solved in issue: https://github.com/trezor/trezor-suite/issues/7839 */}
                {!isTokenAccount && (
                    <>
                        <AccountDetailGraphHeader accountKey={accountKey} />
                        {accountHasTransactions && (
                            <>
                                {!isTestnetAccount && (
                                    <AccountDetailGraph accountKey={accountKey} />
                                )}
                                <Box marginBottom="large" paddingHorizontal="medium">
                                    <Button iconLeft="receive" size="large" onPress={handleReceive}>
                                        Receive
                                    </Button>
                                </Box>
                                <Divider />
                            </>
                        )}
                    </>
                )}
                <Box marginTop="extraLarge" marginBottom="medium" marginHorizontal="large">
                    <Text variant="titleSmall">Transactions</Text>
                </Box>
            </>
        );
    },
);
