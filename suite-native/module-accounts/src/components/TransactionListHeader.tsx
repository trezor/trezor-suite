import React, { memo } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { Box, Button, Divider, Text } from '@suite-native/atoms';
import { AccountKey } from '@suite-common/wallet-types';
import {
    AccountsRootState,
    selectIsTestnetAccount,
    selectHasAccountTransactions,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import {
    AccountsStackParamList,
    AppTabsParamList,
    AppTabsRoutes,
    SendReceiveStackRoutes,
    TabToStackCompositeNavigationProp,
} from '@suite-native/navigation';
import { EthereumTokenSymbol } from '@suite-native/ethereum-tokens';

import { AccountDetailGraph } from './AccountDetailGraph';
import { AccountDetailGraphHeader } from './AccountDetailGraphHeader';
import { AccountDetailCryptoValue } from './AccountDetailCryptoValue';

type AccountDetailHeaderProps = {
    accountKey: AccountKey;
    tokenSymbol?: EthereumTokenSymbol;
};

type AccountsNavigationProps = TabToStackCompositeNavigationProp<
    AppTabsParamList,
    AppTabsRoutes.AccountsStack,
    AccountsStackParamList
>;

export const TransactionListHeader = memo(
    ({ accountKey, tokenSymbol }: AccountDetailHeaderProps) => {
        const navigation = useNavigation<AccountsNavigationProps>();
        const account = useSelector((state: AccountsRootState) =>
            selectAccountByKey(state, accountKey),
        );
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

        if (!account) return null;

        const isTokenAccount = !!tokenSymbol;

        // Graph is temporarily hidden also for ERC20 tokens.
        // Will be solved in issue: https://github.com/trezor/trezor-suite/issues/7839
        const isGraphDisplayed = accountHasTransactions && !isTestnetAccount && !isTokenAccount;

        return (
            <>
                {isGraphDisplayed && (
                    <>
                        <AccountDetailGraphHeader accountKey={accountKey} />
                        <AccountDetailGraph accountKey={accountKey} />
                    </>
                )}
                {isTestnetAccount && (
                    <AccountDetailCryptoValue
                        value={account.balance}
                        networkSymbol={account.symbol}
                        isBalance={false}
                    />
                )}

                <Box marginBottom="large" paddingHorizontal="medium">
                    <Button iconLeft="receive" size="large" onPress={handleReceive}>
                        Receive
                    </Button>
                </Box>
                <Divider />

                <Box marginTop="extraLarge" marginBottom="medium" marginHorizontal="large">
                    <Text variant="titleSmall">Transactions</Text>
                </Box>
            </>
        );
    },
);
