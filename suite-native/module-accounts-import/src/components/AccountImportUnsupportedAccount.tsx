import React from 'react';

import { Box, Text } from '@suite-native/atoms';
import { CryptoIcon } from '@trezor/icons';
import { enabledNetworks } from '@suite-native/config';
import { networks } from '@suite-common/wallet-config';

import { AccountImportSummarySection } from './AccountImportSummarySection';

export const AccountImportUnsupportedAccount = () => (
    <AccountImportSummarySection title="Asset currently not supported">
        <Text>
            We’re working to support all assets available on the Trezor Suite desktop version. More
            soon! The Trezor Suite mobile app currently supports:
        </Text>
        <Box>
            {enabledNetworks.map(network => (
                <Box flexDirection="row">
                    <CryptoIcon name={network} size="small" />
                    <Text>{networks[network].name}</Text>
                </Box>
            ))}
        </Box>
    </AccountImportSummarySection>
);
