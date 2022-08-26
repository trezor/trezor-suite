import React from 'react';

import { CryptoIcon } from '@trezor/icons';
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

type AssetsOverviewProps = {
    accountInfo: AccountInfo | null;
    selectedDevice: string;
    assetName: string;
    onSelectDevice: (value: string | number) => void;
    onAssetNameChange: (value: string) => void;
};

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
                        {accountInfo?.balance}
                    </Text>
                </Box>
                <Text variant="label" color="gray1000">
                    ≈ 0.0003333 BTC
                </Text>
            </Box>
            <Box marginBottom="large">
                <InputWrapper>
                    <Input value={assetName} onChange={onAssetNameChange} label="bitcoines #1" />
                </InputWrapper>
            </Box>
            <InputWrapper label="Device">
                <VStack spacing="small">
                    <SelectableListItem
                        iconName="trezorT"
                        title="Model T"
                        onPress={onSelectDevice}
                        value="firstSelectable"
                        isChecked={selectedDevice === 'firstSelectable'}
                    />
                    <SelectableListItem
                        iconName="trezorT"
                        title="Model One"
                        onPress={onSelectDevice}
                        value="secondSelectable"
                        isChecked={selectedDevice === 'secondSelectable'}
                    />
                    <SelectableListItem
                        iconName="placeholder"
                        title="Other"
                        onPress={onSelectDevice}
                        value="thirdSelectable"
                        isChecked={selectedDevice === 'thirdSelectable'}
                    />
                </VStack>
            </InputWrapper>
        </Box>
    </Card>
);
