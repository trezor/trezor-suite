import { ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { NetworkSymbol, networks } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    selectAccountByKey,
    selectFormattedAccountType,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/wallet-core';
import { Box, Card, HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { CombinedLabelingState, selectAccountLabel } from '@suite-native/labeling';
import {
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    StackProps,
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
        <Text variant="hint" color="textSubdued">
            {title}
        </Text>
        {children}
    </Box>
);

const CryptoNameWithIcon = ({ symbol }: { symbol: NetworkSymbol }) => (
    <HStack spacing="sp8" flexDirection="row" alignItems="center" justifyContent="flex-end">
        <Text variant="hint">{networks[symbol].name}</Text>
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
    const accountLabel = useSelector((state: CombinedLabelingState) =>
        selectAccountLabel(state, account?.key, account?.deviceState),
    );

    if (!account) return null;

    const isBitcoinAccount = account.networkType === 'bitcoin';

    return (
        <Screen
            header={
                <ScreenHeader
                    title={accountLabel ?? ''}
                    rightIcon={<AccountRenameButton accountKey={accountKey} />}
                />
            }
        >
            <Box flex={1} justifyContent="space-between">
                <VStack spacing="sp12">
                    <Card>
                        AccountSettingsExportBip329Button
                        <VStack spacing="sp4">
                            <AccountDetailSettingsRow
                                title={
                                    <Translation id="moduleAccountManagement.accountSettingsScreen.coin" />
                                }
                            >
                                <CryptoNameWithIcon symbol={account.symbol} />
                            </AccountDetailSettingsRow>
                            {formattedAccountType && (
                                <AccountDetailSettingsRow
                                    title={
                                        <Translation id="moduleAccountManagement.accountSettingsScreen.accountType" />
                                    }
                                >
                                    <Text variant="hint">{formattedAccountType}</Text>
                                </AccountDetailSettingsRow>
                            )}
                        </VStack>
                    </Card>
                    {isBitcoinAccount && (
                        <AccountSettingsExportBip329Card accountKey={account.key} />
                    )}
                </VStack>
                <VStack spacing="sp16">
                    <AccountSettingsShowXpubButton accountKey={account.key} />
                    {isPortfolioTrackerDevice && (
                        <AccountSettingsRemoveCoinButton accountKey={account.key} />
                    )}
                </VStack>
            </Box>
        </Screen>
    );
};
