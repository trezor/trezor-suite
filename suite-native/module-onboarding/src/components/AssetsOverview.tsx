import React, { useState } from 'react';

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
};

export const AssetsOverview = ({ accountInfo }: AssetsOverviewProps) => {
    const [selectedDevice, setSelectedDevice] = useState<string>('firstSelectable');
    const [assetName, setAssetName] = useState<string>('');

    const handleSelectDevice = (value: string | number) => {
        setSelectedDevice(value.toString());
    };

    return (
        <Card>
            <Box marginTop="large" marginBottom="medium">
                <Box alignItems="center" justifyContent="center" marginBottom="medium">
                    <CryptoIcon name="btc" size="large" />
                    <Box marginTop="large" marginBottom="small">
                        <Text variant="titleSmall" color="black">
                            {accountInfo?.balance}
                        </Text>
                    </Box>
                    <Text variant="label" color="black">
                        ≈ 0.0003333 BTC
                    </Text>
                </Box>
                <Box marginBottom="large">
                    <InputWrapper>
                        <Input value={assetName} onChange={setAssetName} label="bitcoines #1" />
                    </InputWrapper>
                </Box>
                <InputWrapper label="Device">
                    <VStack spacing="small">
                        <SelectableListItem
                            iconName="trezorT"
                            title="Model T"
                            onPress={handleSelectDevice}
                            value="firstSelectable"
                            isChecked={selectedDevice === 'firstSelectable'}
                        />
                        <SelectableListItem
                            iconName="trezorT"
                            title="Model One"
                            onPress={handleSelectDevice}
                            value="secondSelectable"
                            isChecked={selectedDevice === 'secondSelectable'}
                        />
                        <SelectableListItem
                            iconName="placeholder"
                            title="Other"
                            onPress={handleSelectDevice}
                            value="thirdSelectable"
                            isChecked={selectedDevice === 'thirdSelectable'}
                        />
                    </VStack>
                </InputWrapper>
            </Box>
        </Card>
    );
};
