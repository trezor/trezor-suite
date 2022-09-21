import React from 'react';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { Box, Card, Text } from '@suite-native/atoms';
import { TextInputField } from '@suite-native/forms';
import { AccountInfo } from '@trezor/connect';
import { CryptoIcon } from '@trezor/icons';

type AssetsOverviewProps = {
    accountInfo: AccountInfo;
    currencySymbol: NetworkSymbol;
};

export const AccountImportOverview = ({ accountInfo, currencySymbol }: AssetsOverviewProps) => (
    <Card>
        <Box marginTop="large" marginBottom="medium">
            <Box alignItems="center" justifyContent="center" marginBottom="medium">
                <CryptoIcon name="btc" size="large" />
                <Box marginTop="large" marginBottom="small">
                    <Text variant="titleSmall" color="gray1000">
                        {/* FIXME load currency from settings and convert with fiat rates */}
                        {accountInfo.balance} Kč
                    </Text>
                </Box>
                <Text variant="label" color="gray1000">
                    ≈ {formatNetworkAmount(accountInfo.availableBalance, currencySymbol, true)}
                </Text>
            </Box>
            <Box marginBottom="large">
                <TextInputField name="accountLabel" label="Account label" />
            </Box>
        </Box>
    </Card>
);
