import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { shouldDisplayExportBip329Labels } from '@suite-common/bip329';
import { selectIsPortfolioTrackerDevice } from '@suite-common/device';
import { selectIsSuiteSyncEnabled } from '@suite-common/suite-sync';
import { type NetworkSymbol, networks } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    selectAccountByKey,
    selectFormattedAccountType,
    selectIsAccountUtxoBased,
} from '@suite-common/wallet-core';
import { Box, Card, HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { AccountLabel } from '@suite-native/labeling';
import {
    type RootStackParamList,
    type RootStackRoutes,
    Screen,
    ScreenHeader,
    type StackProps,
} from '@suite-native/navigation';

import { AccountRenameButton } from '../components/AccountRenameButton';
import { AccountSettingsExportBip329Card } from '../components/AccountSettingsExportBip329Card';
import { AccountSettingsRemoveCoinButton } from '../components/AccountSettingsRemoveCoinButton';
import { AccountSettingsShowXpubButton } from '../components/AccountSettingsShowXpubButton';

const AccountDetailSettingsRow = ({
    title,
    children,
}: {
    title: ReactNode;
    children: ReactNode;
}) => (
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
        <CryptoIcon symbol={symbol} size="extraSmall" />
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
        selectFormattedAccountType(state, accountKey),
    );

    const isUtxoBasedAccount = useSelector((state: AccountsRootState) =>
        selectIsAccountUtxoBased(state, accountKey),
    );

    const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled);
    if (!account) return null;

    const shouldDisplayExport = shouldDisplayExportBip329Labels({
        account,
        isSuiteSyncEnabled,
    });

    return (
        <Screen
            header={
                <ScreenHeader
                    title={<AccountLabel account={account} />}
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
                        </VStack>
                    </Card>
                    {shouldDisplayExport && (
                        <AccountSettingsExportBip329Card
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
