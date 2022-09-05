import React from 'react';

import { CryptoIcon, IconName } from '@trezor/icons';
import {
    Box,
    Card,
    Input,
    InputWrapper,
    SelectableListItem,
    Text,
    VStack,
} from '@suite-native/atoms';
import { AccountInfo } from '@trezor/connect';
import { formatNetworkAmount } from '@suite-common/wallet-utils';

type AssetsOverviewProps = {
    accountInfo: AccountInfo;
    selectedDevice: string;
    assetName: string;
    onSelectDevice: (value: string | number) => void;
    onAssetNameChange: (value: string) => void;
};

export const dummyDevices: Array<{ icon: IconName; title: string; value: string }> = [
    {
        icon: 'trezorT',
        title: 'Model T',
        value: 'modelT',
    },
    {
        icon: 'trezorT',
        title: 'Model One',
        value: 'modelOne',
    },
];

export const AssetsOverview = ({
    accountInfo,
    selectedDevice,
    assetName,
    onSelectDevice,
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
                    ≈ {formatNetworkAmount(accountInfo.availableBalance, 'btc', true)}
                </Text>
            </Box>
            <Box marginBottom="large">
                <InputWrapper>
                    <Input value={assetName} onChange={onAssetNameChange} label="" />
                </InputWrapper>
            </Box>
            <InputWrapper label="Device">
                <VStack spacing="small">
                    {dummyDevices.map(device => (
                        <SelectableListItem
                            key={device.value}
                            iconName={device.icon}
                            title={device.title}
                            onPress={onSelectDevice}
                            value={device.value}
                            isChecked={selectedDevice === device.value}
                        />
                    ))}
                </VStack>
            </InputWrapper>
        </Box>
    </Card>
);
