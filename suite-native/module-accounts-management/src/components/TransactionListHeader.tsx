import { memo } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { Box, Button, Divider, Text, VStack } from '@suite-native/atoms';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import {
    AccountsRootState,
    selectIsTestnetAccount,
    selectHasAccountTransactions,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import { isEthereumAccountSymbol } from '@suite-common/wallet-utils';
import {
    AppTabsParamList,
    RootStackParamList,
    RootStackRoutes,
    TabToStackCompositeNavigationProp,
} from '@suite-native/navigation';
import { Translation, useTranslate } from '@suite-native/intl';

import { AccountDetailGraph } from './AccountDetailGraph';
import { AccountDetailCryptoValue } from './AccountDetailCryptoValue';
import { AccountDetailTokenHeader } from './AccountDetailTokenHeader';
import { IncludeTokensToggle } from './IncludeTokensToggle';
import { CoinPriceCard } from './CoinPriceCard';

type AccountDetailHeaderProps = {
    accountKey: AccountKey;
    areTokensIncluded: boolean;
    toggleIncludeTokenTransactions: () => void;
    tokenContract?: TokenAddress;
};

type TransactionListHeaderContentProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

type AccountsNavigationProps = TabToStackCompositeNavigationProp<
    AppTabsParamList,
    RootStackRoutes.ReceiveModal,
    RootStackParamList
>;

const TransactionListHeaderContent = ({
    accountKey,
    tokenContract,
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

    const isTokenAccount = !!tokenContract;

    // Graph is temporarily hidden also for ERC20 tokens.
    // Will be solved in issue: https://github.com/trezor/trezor-suite/issues/7839
    const isGraphDisplayed = accountHasTransactions && !isTestnetAccount && !isTokenAccount;

    if (isGraphDisplayed) {
        return <AccountDetailGraph accountKey={accountKey} />;
    }
    if (isTokenAccount) {
        return <AccountDetailTokenHeader accountKey={accountKey} tokenContract={tokenContract} />;
    }

    if (isTestnetAccount) {
        return (
            <AccountDetailCryptoValue
                value={account.availableBalance}
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
        tokenContract,
    }: AccountDetailHeaderProps) => {
        const { translate } = useTranslate();
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

        if (!account) return null;

        const handleReceive = () => {
            navigation.navigate(RootStackRoutes.ReceiveModal, {
                accountKey,
                tokenContract,
            });
        };

        const isTokenDetail = !!tokenContract;
        const isEthereumAccountDetail = !isTokenDetail && isEthereumAccountSymbol(account.symbol);
        const isPriceCardDisplayed = !isTestnetAccount && !isTokenDetail;

        return (
            <Box marginBottom="small">
                <VStack spacing="large">
                    <TransactionListHeaderContent
                        accountKey={accountKey}
                        tokenContract={tokenContract}
                    />
                    {accountHasTransactions && (
                        <Box marginVertical="medium" paddingHorizontal="medium">
                            <Button iconLeft="receive" size="large" onPress={handleReceive}>
                                {translate('transactions.receive')}
                            </Button>
                        </Box>
                    )}
                    {isPriceCardDisplayed && (
                        <Box marginBottom={accountHasTransactions ? undefined : 'medium'}>
                            <CoinPriceCard accountKey={accountKey} />
                        </Box>
                    )}

                    {accountHasTransactions && (
                        <>
                            <Divider />
                            <Box marginVertical="small" marginHorizontal="large">
                                <Text variant="titleSmall">
                                    <Translation id="transactions.title" />
                                </Text>
                            </Box>
                        </>
                    )}
                </VStack>

                {isEthereumAccountDetail && accountHasTransactions && (
                    <IncludeTokensToggle
                        isToggled={areTokensIncluded}
                        onToggle={toggleIncludeTokenTransactions}
                    />
                )}
            </Box>
        );
    },
);
