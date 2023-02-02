import React from 'react';

import { useNavigation } from '@react-navigation/core';

import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import { useFormatters } from '@suite-common/formatters';
import { Box, Card, IconButton, Text } from '@suite-native/atoms';
import { TextInputField } from '@suite-native/forms';
import { AccountInfo } from '@trezor/connect';
import { CryptoIcon } from '@trezor/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { CryptoToFiatAmountFormatter } from '@suite-native/formatters';

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
    const { CryptoAmountFormatter } = useFormatters();
    const navigation = useNavigation();

    return (
        <Card style={applyStyle(assetCardStyle)}>
            <Box flexDirection="row" marginBottom="large" justifyContent="space-between">
                <Box flexDirection="row">
                    <CryptoIcon name={networkSymbol} size="large" />
                    <Box marginLeft="medium">
                        <Text>{networks[networkSymbol].name}</Text>
                        <Text variant="label" color="gray1000">
                            <CryptoAmountFormatter
                                value={accountInfo.availableBalance}
                                symbol={networkSymbol}
                            />
                        </Text>
                    </Box>
                </Box>
                <IconButton
                    iconName="trash"
                    colorScheme="gray"
                    onPress={() => navigation.goBack()}
                    size="large"
                    isRounded
                />
            </Box>
            <Box marginBottom="large">
                <Text variant="titleLarge" color="gray1000">
                    <CryptoToFiatAmountFormatter
                        value={accountInfo.availableBalance}
                        network={networkSymbol}
                        isDiscreetText={false}
                    />
                </Text>
            </Box>
            <Box>
                <TextInputField name="accountLabel" label="Account label" />
            </Box>
        </Card>
    );
};
