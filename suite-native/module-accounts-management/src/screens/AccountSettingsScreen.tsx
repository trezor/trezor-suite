import { ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import {
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenSubHeader,
    StackProps,
} from '@suite-native/navigation';
import { Box, Card, HStack, Text, VStack } from '@suite-native/atoms';
import {
    AccountsRootState,
    selectAccountByKey,
    selectAccountLabel,
    selectFormattedAccountType,
} from '@suite-common/wallet-core';
import { CryptoIcon } from '@suite-common/icons';

import { AccountRenameButton } from '../components/AccountRenameButton';
import { AccountSettingsShowXpubButton } from '../components/AccountSettingsShowXpubButton';
import { AccountSettingsRemoveCoinButton } from '../components/AccountSettingsRemoveCoinButton';

const AccountDetailSettingsRow = ({ title, children }: { title: string; children: ReactNode }) => (
    <Box paddingVertical="s" flexDirection="row" alignItems="center" justifyContent="space-between">
        <Text variant="hint" color="textSubdued">
            {title}
        </Text>
        {children}
    </Box>
);

const CryptoNameWithIcon = ({ symbol }: { symbol: NetworkSymbol }) => (
    <HStack spacing="s" flexDirection="row" alignItems="center" justifyContent="flex-end">
        <Text variant="hint">{networks[symbol].name}</Text>
        <CryptoIcon symbol={symbol} size="xs" />
    </HStack>
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
            subheader={
                <ScreenSubHeader
                    content={accountLabel}
                    rightIcon={<AccountRenameButton accountKey={accountKey} />}
                />
            }
        >
            <Box flex={1} justifyContent="space-between">
                <Card>
                    <VStack spacing="xs">
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
                <VStack marginHorizontal="m" spacing="m">
                    <AccountSettingsShowXpubButton accountKey={account.key} />
                    <AccountSettingsRemoveCoinButton accountKey={account.key} />
                </VStack>
            </Box>
        </Screen>
    );
};
