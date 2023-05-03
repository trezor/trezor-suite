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
import { EthereumTokenSymbol } from '@suite-native/ethereum-tokens';
import { isEthereumAccountSymbol } from '@suite-common/wallet-utils';
import {
    AppTabsParamList,
    RootStackParamList,
    RootStackRoutes,
    TabToStackCompositeNavigationProp,
} from '@suite-native/navigation';

import { AccountDetailGraph } from './AccountDetailGraph';
import { AccountDetailGraphHeader } from './AccountDetailGraphHeader';
import { AccountDetailCryptoValue } from './AccountDetailCryptoValue';
import { AccountDetailTokenHeader } from './AccountDetailTokenHeader';
import { IncludeTokensToggle } from './IncludeTokensToggle';

type AccountDetailHeaderProps = {
    accountKey: AccountKey;
    areTokensIncluded: boolean;
    toggleIncludeTokenTransactions: () => void;
    tokenSymbol?: EthereumTokenSymbol;
};

type TransactionListHeaderContentProps = {
    accountKey: AccountKey;
    tokenSymbol?: EthereumTokenSymbol;
};

type AccountsNavigationProps = TabToStackCompositeNavigationProp<
    AppTabsParamList,
    RootStackRoutes.ReceiveModal,
    RootStackParamList
>;

const TransactionListHeaderContent = ({
    accountKey,
    tokenSymbol,
}: TransactionListHeaderContentProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const accountHasTransactions = useSelector((state: AccountsRootState) =>
        selectHasAccountTransactions(state, accountKey),
    );
    const isTestnetAccount = useSelector((state: AccountsRootState) =>
        selectIsTestnetAccount(state, accountKey),
    );

    if (!account) return null;

    const isTokenAccount = !!tokenSymbol;

    // Graph is temporarily hidden also for ERC20 tokens.
    // Will be solved in issue: https://github.com/trezor/trezor-suite/issues/7839
    const isGraphDisplayed = accountHasTransactions && !isTestnetAccount && !isTokenAccount;

    if (isGraphDisplayed) {
        return (
            <>
                <AccountDetailGraphHeader accountKey={accountKey} />
                <AccountDetailGraph accountKey={accountKey} />
            </>
        );
    }
    if (isTokenAccount) {
        return <AccountDetailTokenHeader accountKey={accountKey} tokenSymbol={tokenSymbol} />;
    }

    if (isTestnetAccount) {
        return (
            <AccountDetailCryptoValue
                value={account.balance}
                networkSymbol={account.symbol}
                isBalance={false}
            />
        );
    }

    return null;
};

export const TransactionListHeader = memo(
    ({
        accountKey,
        areTokensIncluded,
        toggleIncludeTokenTransactions,
        tokenSymbol,
    }: AccountDetailHeaderProps) => {
        const navigation = useNavigation<AccountsNavigationProps>();

        const account = useSelector((state: AccountsRootState) =>
            selectAccountByKey(state, accountKey),
        );
        const accountHasTransactions = useSelector((state: AccountsRootState) =>
            selectHasAccountTransactions(state, accountKey),
        );

        if (!account) return null;

        const handleReceive = () => {
            navigation.navigate(RootStackRoutes.ReceiveModal, {
                accountKey,
                tokenSymbol,
            });
        };

        const isTokenDetail = !!tokenSymbol;
        const isEthereumAccountDetail = !isTokenDetail && isEthereumAccountSymbol(account.symbol);

        return (
            <>
                <TransactionListHeaderContent accountKey={accountKey} tokenSymbol={tokenSymbol} />
                {accountHasTransactions && (
                    <>
                        <Divider />
                        <Box marginVertical="large" paddingHorizontal="medium">
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

                {isEthereumAccountDetail && accountHasTransactions && (
                    <IncludeTokensToggle
                        isToggled={areTokensIncluded}
                        onToggle={toggleIncludeTokenTransactions}
                    />
                )}
            </>
        );
    },
);
