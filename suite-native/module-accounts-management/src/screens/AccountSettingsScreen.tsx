import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { shouldDisplayExportImportBip329Labels } from '@suite-common/bip329';
import { selectIsPortfolioTrackerDevice } from '@suite-common/device';
import { selectIsSuiteSyncEnabled } from '@suite-common/suite-sync';
import { type NetworkSymbol, networks } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    selectAccountByKey,
    selectFormattedAccountTypeWithDefault,
    selectIsAccountUtxoBased,
} from '@suite-common/wallet-core';
import { Box, Card, HStack, Text, VStack } from '@suite-native/atoms';
import { Bip329ManageLabelsCard } from '@suite-native/bip329';
import { TokenIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    type RootStackRoutes,
    Screen,
    ScreenHeader,
    type StackProps,
} from '@suite-native/navigation';

import { AccountDetailScreenHeaderContent } from '../components/AccountDetailScreenHeader';
import { AccountRenameButton } from '../components/AccountRenameButton';
import { AccountSettingsRemoveCoinButton } from '../components/AccountSettingsRemoveCoinButton';
import { AccountSettingsShowXpubButton } from '../components/AccountSettingsShowXpubButton';

interface AccountDetailSettingsRowProps {
    title: ReactNode;
    children: ReactNode;
}

const AccountDetailSettingsRow = ({ title, children }: AccountDetailSettingsRowProps) => (
    <Box
        paddingVertical="sp8"
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
    >
        <Text variant="body-sm" color="contentSecondary">
            {title}
        </Text>
        {children}
    </Box>
);

const CryptoNameWithIcon = ({ symbol }: { symbol: NetworkSymbol }) => (
    <HStack spacing="sp8" flexDirection="row" alignItems="center" justifyContent="flex-end">
        <Text variant="body-sm">{networks[symbol].name}</Text>
        <TokenIcon symbol={symbol} size="extraSmall" />
    </HStack>
);

export const AccountSettingsScreen = ({
    route,
}: StackProps<RootStackParamList, RootStackRoutes.AccountSettings>) => {
    const { accountKey } = route.params;

    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const formattedAccountType = useSelector((state: AccountsRootState) =>
        selectFormattedAccountTypeWithDefault(state, accountKey),
    );

    const isUtxoBasedAccount = useSelector((state: AccountsRootState) =>
        selectIsAccountUtxoBased(state, accountKey),
    );

    const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled);
    if (!account) return null;

    const shouldDisplayExportImport = shouldDisplayExportImportBip329Labels({
        account,
        isSuiteSyncEnabled,
    });

    return (
        <Screen
            header={
                <ScreenHeader
                    customContent={<AccountDetailScreenHeaderContent account={account} />}
                    rightIcon={<AccountRenameButton accountKey={accountKey} />}
                />
            }
        >
            <Box flex={1} justifyContent="space-between">
                <VStack spacing="sp12">
                    <Card>
                        <VStack spacing="sp4">
                            <AccountDetailSettingsRow
                                title={
                                    <Translation id="moduleAccountManagement.accountSettingsScreen.coin" />
                                }
                            >
                                <CryptoNameWithIcon symbol={account.symbol} />
                            </AccountDetailSettingsRow>

                            {!!formattedAccountType && (
                                <AccountDetailSettingsRow
                                    title={
                                        <Translation id="moduleAccountManagement.accountSettingsScreen.accountType" />
                                    }
                                >
                                    <Text variant="body-sm">{formattedAccountType}</Text>
                                </AccountDetailSettingsRow>
                            )}

                            {account.path && (
                                <AccountDetailSettingsRow
                                    title={
                                        <Translation id="moduleAccountManagement.accountSettingsScreen.derivationPath" />
                                    }
                                >
                                    <Text variant="body-sm">{account.path}</Text>
                                </AccountDetailSettingsRow>
                            )}
                        </VStack>
                    </Card>
                    {shouldDisplayExportImport && (
                        <Bip329ManageLabelsCard
                            accountDescriptor={account.descriptor}
                            networkSymbol={account.symbol}
                            deviceStaticSessionId={account.deviceState}
                        />
                    )}
                </VStack>
                <VStack spacing="sp16">
                    {isUtxoBasedAccount && (
                        <AccountSettingsShowXpubButton accountKey={account.key} />
                    )}
                    {isPortfolioTrackerDevice && (
                        <AccountSettingsRemoveCoinButton accountKey={account.key} />
                    )}
                </VStack>
            </Box>
        </Screen>
    );
};
