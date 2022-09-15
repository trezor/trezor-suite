import React from 'react';

import { CryptoIcon } from '@trezor/icons';
import { Box, Card, Input, InputWrapper, Text } from '@suite-native/atoms';
import { AccountInfo } from '@trezor/connect';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { NetworkSymbol } from '@suite-common/wallet-config';

type AssetsOverviewProps = {
    accountInfo: AccountInfo;
    assetName: string;
    currencySymbol: NetworkSymbol;
    onAssetNameChange: (value: string) => void;
};

export const AccountImportOverview = ({
    accountInfo,
    assetName,
    currencySymbol,
    onAssetNameChange,
}: AssetsOverviewProps) => (
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
                <InputWrapper>
                    <Input value={assetName} onChange={onAssetNameChange} label="" />
                </InputWrapper>
            </Box>
        </Box>
    </Card>
);
