import { useSelector } from 'react-redux';

import { Box, ErrorMessage, Pictogram, VStack, Text } from '@suite-native/atoms';
import {
    AccountsRootState,
    selectAccountByDescriptorAndNetworkSymbol,
} from '@suite-common/wallet-core';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountInfo } from '@trezor/connect';
import { supportedNetworkSymbols } from '@suite-native/config';

import { AccountImportSummaryForm } from './AccountImportSummaryForm';
import { AccountAlreadyImported } from './AccountAlreadyImported';

type AccountImportDetailProps = {
    networkSymbol: NetworkSymbol;
    accountInfo: AccountInfo;
};

export const AccountImportSummary = ({ networkSymbol, accountInfo }: AccountImportDetailProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByDescriptorAndNetworkSymbol(state, accountInfo.descriptor, networkSymbol),
    );

    const isAccountImportSupported = supportedNetworkSymbols.some(
        network => network === networkSymbol,
    );

    if (!isAccountImportSupported) {
        return <ErrorMessage errorMessage="Unsupported account network type." />;
    }

    const title = account ? 'Coin already synced' : 'Coin synced';
    const subtitle = account ? "Here's what you have in your account." : undefined;

    return (
        <VStack spacing="extraLarge" flex={1}>
            <Box flex={1} alignItems="center" justifyContent="center">
                <Pictogram
                    title={
                        <Text
                            variant="titleSmall"
                            testID="@account-import/coin-synced/success-text"
                        >
                            {title}
                        </Text>
                    }
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
