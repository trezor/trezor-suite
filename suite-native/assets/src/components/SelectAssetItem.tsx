import React from 'react';
import { TouchableOpacity } from 'react-native';

import { CryptoIcon, CryptoIconName } from '@trezor/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Text } from '@suite-native/atoms';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { useFormatters } from '@suite-common/formatters';

type SelectAssetItemProps = {
    cryptoCurrencySymbol: NetworkSymbol;
    cryptoCurrencyName: string;
    iconName: CryptoIconName;
    onPress?: () => void;
};

const assetItemWrapperStyle = prepareNativeStyle(() => ({
    flexDirection: 'row',
    alignItems: 'center',
}));

const assetContentStyle = prepareNativeStyle(() => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    marginLeft: 10,
}));

export const SelectAssetItem = ({
    cryptoCurrencyName,
    cryptoCurrencySymbol,
    iconName,
    onPress,
}: SelectAssetItemProps) => {
    const { applyStyle } = useNativeStyles();

    const { CurrencySymbolFormatter } = useFormatters();

    return (
        <TouchableOpacity disabled={!onPress} onPress={onPress}>
            <Box style={applyStyle(assetItemWrapperStyle)}>
                <CryptoIcon name={iconName} size="large" />
                <Box style={applyStyle(assetContentStyle)}>
                    <Box flex={1} justifyContent="space-between" alignItems="flex-start">
                        <Text>{cryptoCurrencyName}</Text>
                        <Box flexDirection="row" alignItems="center">
                            <Text variant="hint" color="gray600">
                                {CurrencySymbolFormatter.format(cryptoCurrencySymbol)}
                            </Text>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </TouchableOpacity>
    );
};
