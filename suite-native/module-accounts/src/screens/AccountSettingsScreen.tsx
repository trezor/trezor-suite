import React, { ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import {
    AccountsStackParamList,
    AccountsStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    StackToStackCompositeNavigationProps,
    StackProps,
} from '@suite-native/navigation';
import { Box, Button, Card, Text, VStack } from '@suite-native/atoms';
import {
    accountsActions,
    AccountsRootState,
    selectAccountByKey,
    selectAccountLabel,
    selectFormattedAccountType,
} from '@suite-common/wallet-core';
import { CryptoIcon } from '@trezor/icons';

import { AccountRenameButton } from '../components/AccountRenameButton';
import { AccountSettingsShowXpub } from '../components/AccountSettingsShowXpub';

const AccountDetailSettingsRow = ({ title, children }: { title: string; children: ReactNode }) => (
    <Box flexDirection="row" alignItems="center" justifyContent="space-between">
        <Text variant="hint" color="textSubdued">
            {title}
        </Text>
        {children}
    </Box>
);

const CryptoNameWithIcon = ({ symbol }: { symbol: NetworkSymbol }) => (
    <Box flexDirection="row" alignItems="center" justifyContent="flex-end">
        <Text variant="hint">{networks[symbol].name}</Text>
        <Box marginLeft="small">
            <CryptoIcon name={symbol} size="extraSmall" />
        </Box>
    </Box>
);

export const AccountSettingsScreen = ({
    route,
}: StackProps<RootStackParamList, RootStackRoutes.AccountSettings>) => {
    const { accountKey } = route.params;

    const navigation =
        useNavigation<
            StackToStackCompositeNavigationProps<
                RootStackParamList,
                RootStackRoutes.AccountSettings,
                AccountsStackParamList
            >
        >();
    const dispatch = useDispatch();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const accountLabel = useSelector((state: AccountsRootState) =>
        selectAccountLabel(state, accountKey),
    );

    const formattedAccountType = useSelector((state: AccountsRootState) =>
        selectFormattedAccountType(state, accountKey),
    );

    if (!account) return null;

    const handleRemoveAccount = () => {
        dispatch(accountsActions.removeAccount([account]));
        navigation.navigate(AccountsStackRoutes.Accounts);
    };

    return (
        <Screen
            header={
                <ScreenHeader
                    content={accountLabel}
                    rightIcon={<AccountRenameButton accountKey={accountKey} />}
                    titleVariant="body"
                />
            }
        >
            <Box flex={1} justifyContent="space-between">
                <Card>
                    <VStack spacing="large">
                        <AccountDetailSettingsRow title="Coin">
                            <CryptoNameWithIcon symbol={account.symbol} />
                        </AccountDetailSettingsRow>
                        {formattedAccountType && (
                            <AccountDetailSettingsRow title="Account type">
                                <Text variant="hint">{formattedAccountType}</Text>
                            </AccountDetailSettingsRow>
                        )}
                    </VStack>
                </Card>
                <VStack spacing="small">
                    <AccountSettingsShowXpub accountKey={account.key} />
                    <Button onPress={handleRemoveAccount} colorScheme="dangerElevation0">
                        Remove coin
                    </Button>
                </VStack>
            </Box>
        </Screen>
    );
};
