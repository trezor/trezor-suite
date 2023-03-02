import React from 'react';

import { useNavigation } from '@react-navigation/core';

import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import { Box, Card, IconButton, Text } from '@suite-native/atoms';
import { TextInputField } from '@suite-native/forms';
import { AccountInfo } from '@trezor/connect';
import { CryptoIcon } from '@trezor/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { isTestnet } from '@suite-common/wallet-utils';

type AssetsOverviewProps = {
    accountInfo: AccountInfo;
    networkSymbol: NetworkSymbol;
};

const assetCardStyle = prepareNativeStyle(utils => ({
    padding: utils.spacings.large,
    borderRadius: utils.borders.radii.large,
    marginBottom: utils.spacings.large,
    width: '100%',
}));

export const AccountImportOverview = ({ accountInfo, networkSymbol }: AssetsOverviewProps) => {
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation();

    return (
        <Card style={applyStyle(assetCardStyle)}>
            <Box flexDirection="row" marginBottom="large" justifyContent="space-between">
                <Box flexDirection="row">
                    <CryptoIcon name={networkSymbol} size="large" />
                    <Box marginLeft="medium">
                        <Text>{networks[networkSymbol].name}</Text>
                        <CryptoAmountFormatter
                            value={accountInfo.availableBalance}
                            network={networkSymbol}
                            isBalance={false}
                            variant="label"
                        />
                    </Box>
                </Box>
                <IconButton
                    iconName="trash"
                    colorScheme="tertiaryElevation1"
                    onPress={() => navigation.goBack()}
                    size="medium"
                />
            </Box>
            {!isTestnet(networkSymbol) && (
                <Box marginBottom="large">
                    <CryptoToFiatAmountFormatter
                        value={accountInfo.availableBalance}
                        network={networkSymbol}
                        isDiscreetText={false}
                        variant="titleLarge"
                    />
                </Box>
            )}
            <Box>
                <TextInputField name="accountLabel" label="Account label" />
            </Box>
        </Card>
    );
};
