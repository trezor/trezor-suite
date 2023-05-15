import React, { ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import {
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    StackProps,
} from '@suite-native/navigation';
import { Box, Card, Text, VStack } from '@suite-native/atoms';
import {
    AccountsRootState,
    selectAccountByKey,
    selectAccountLabel,
    selectFormattedAccountType,
} from '@suite-common/wallet-core';
import { CryptoIcon } from '@trezor/icons';

import { AccountRenameButton } from '../components/AccountRenameButton';
import { AccountSettingsShowXpub } from '../components/AccountSettingsShowXpub';
import { AccountSettingsRemoveCoin } from '../components/AccountSettingsRemoveCoin';

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
                    <AccountSettingsRemoveCoin accountKey={account.key} />
                </VStack>
            </Box>
        </Screen>
    );
};
