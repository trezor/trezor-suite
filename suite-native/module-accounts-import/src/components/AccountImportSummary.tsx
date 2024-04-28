import { useSelector } from 'react-redux';

import { Box, ErrorMessage, PictogramTitleHeader, VStack, Text } from '@suite-native/atoms';
import {
    AccountsRootState,
    DeviceRootState,
    selectDeviceAccountByDescriptorAndNetworkSymbol,
} from '@suite-common/wallet-core';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountInfo } from '@trezor/connect';
import { portfolioTrackerSupportedNetworks } from '@suite-native/config';
import { Translation } from '@suite-native/intl';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';

import { AccountImportSummaryForm } from './AccountImportSummaryForm';
import { AccountAlreadyImported } from './AccountAlreadyImported';

type AccountImportDetailProps = {
    networkSymbol: NetworkSymbol;
    accountInfo: AccountInfo;
};

export const AccountImportSummary = ({ networkSymbol, accountInfo }: AccountImportDetailProps) => {
    const [isRegtestEnabled] = useFeatureFlag(FeatureFlag.IsRegtestEnabled);
    const account = useSelector((state: AccountsRootState & DeviceRootState) =>
        selectDeviceAccountByDescriptorAndNetworkSymbol(
            state,
            accountInfo.descriptor,
            networkSymbol,
        ),
    );

    const isAccountImportSupported =
        portfolioTrackerSupportedNetworks.some(symbol => symbol === networkSymbol) ||
        (networkSymbol === 'regtest' && isRegtestEnabled);

    if (!isAccountImportSupported) {
        return (
            <ErrorMessage
                errorMessage={<Translation id="moduleAccountImport.error.unsupportedNetworkType" />}
            />
        );
    }

    const title = (
        <Translation
            id={
                account
                    ? 'moduleAccountImport.summaryScreen.title.alreadySynced'
                    : 'moduleAccountImport.summaryScreen.title.confirmToAdd'
            }
        />
    );
    const subtitle = account ? (
        <Translation id="moduleAccountImport.summaryScreen.subtitle" />
    ) : undefined;

    return (
        <VStack spacing="extraLarge" flex={1}>
            <Box flex={1} alignItems="center" justifyContent="center">
                <PictogramTitleHeader
                    title={<Text variant="titleSmall">{title}</Text>}
                    subtitle={subtitle}
                    variant="green"
                    icon="syncedCoin"
                />
            </Box>
            <Box flex={1}>
                {account ? (
                    <AccountAlreadyImported account={account} />
                ) : (
                    <AccountImportSummaryForm
                        networkSymbol={networkSymbol}
                        accountInfo={accountInfo}
                    />
                )}
            </Box>
        </VStack>
    );
};
