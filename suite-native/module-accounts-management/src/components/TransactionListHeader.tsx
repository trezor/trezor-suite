import { memo } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { Box, Button, Divider, HStack, Text, VStack } from '@suite-native/atoms';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import {
    AccountsRootState,
    selectIsTestnetAccount,
    selectHasAccountTransactions,
    selectAccountByKey,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/wallet-core';
import {
    AppTabsParamList,
    RootStackParamList,
    RootStackRoutes,
    SendStackRoutes,
    TabToStackCompositeNavigationProp,
} from '@suite-native/navigation';
import { Translation } from '@suite-native/intl';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { isCoinWithTokens } from '@suite-native/tokens';

import { AccountDetailGraph } from './AccountDetailGraph';
import { AccountDetailCryptoValue } from './AccountDetailCryptoValue';
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

const SEND_NETWORK_WHITELIST: Readonly<NetworkSymbol[]> = ['btc', 'test', 'regtest'];

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
        return <AccountDetailGraph accountKey={accountKey} tokenContract={tokenContract} />;
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
        const navigation = useNavigation<AccountsNavigationProps>();
        const [isSendEnabled] = useFeatureFlag(FeatureFlag.IsSendEnabled);

        const account = useSelector((state: AccountsRootState) =>
            selectAccountByKey(state, accountKey),
        );
        const accountHasTransactions = useSelector((state: AccountsRootState) =>
            selectHasAccountTransactions(state, accountKey),
        );
        const isTestnetAccount = useSelector((state: AccountsRootState) =>
            selectIsTestnetAccount(state, accountKey),
        );
        const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);

        if (!account) return null;

        const handleReceive = () => {
            navigation.navigate(RootStackRoutes.ReceiveModal, {
                accountKey,
                tokenContract,
                closeActionType: 'back',
            });
        };

        const handleSend = () => {
            navigation.navigate(RootStackRoutes.SendStack, {
                screen: SendStackRoutes.SendOutputs,
                params: {
                    accountKey,
                },
            });
        };

        const isTokenDetail = !!tokenContract;
        const canHaveTokens = !isTokenDetail && isCoinWithTokens(account.symbol);
        const isPriceCardDisplayed = !isTestnetAccount && !isTokenDetail;

        const isSendButtonDisplayed =
            isSendEnabled &&
            SEND_NETWORK_WHITELIST.includes(account.symbol) &&
            !isPortfolioTrackerDevice;

        return (
            <Box marginBottom="sp8">
                <VStack spacing="sp24">
                    <TransactionListHeaderContent
                        accountKey={accountKey}
                        tokenContract={tokenContract}
                    />
                    {accountHasTransactions && (
                        <HStack marginVertical="sp16" paddingHorizontal="sp16" flex={1}>
                            <Box flex={1}>
                                <Button
                                    viewLeft="receive"
                                    size="large"
                                    onPress={handleReceive}
                                    testID="@account-detail/receive-button"
                                >
                                    <Translation id="transactions.receive" />
                                </Button>
                            </Box>
                            {isSendButtonDisplayed && (
                                <Box flex={1}>
                                    <Button
                                        viewLeft="send"
                                        size="large"
                                        onPress={handleSend}
                                        testID="@account-detail/send-button"
                                    >
                                        <Translation id="transactions.send" />
                                    </Button>
                                </Box>
                            )}
                        </HStack>
                    )}
                    {isPriceCardDisplayed && (
                        <Box marginBottom={accountHasTransactions ? undefined : 'sp16'}>
                            <CoinPriceCard accountKey={accountKey} />
                        </Box>
                    )}

                    {accountHasTransactions && (
                        <>
                            <Divider />
                            <Box marginVertical="sp8" marginHorizontal="sp24">
                                <Text variant="titleSmall">
                                    <Translation id="transactions.title" />
                                </Text>
                            </Box>
                        </>
                    )}
                </VStack>

                {canHaveTokens && accountHasTransactions && (
                    <IncludeTokensToggle
                        isToggled={areTokensIncluded}
                        onToggle={toggleIncludeTokenTransactions}
                    />
                )}
            </Box>
        );
    },
);
