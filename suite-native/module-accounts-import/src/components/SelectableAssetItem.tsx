import React from 'react';
import { TouchableOpacity } from 'react-native';

import { CryptoIcon, CryptoIconName } from '@trezor/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Button, Text } from '@suite-native/atoms';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { useFormatters } from '@suite-common/formatters';

export type SelectableAssetItemProps = {
    cryptoCurrencySymbol: NetworkSymbol;
    cryptoCurrencyName: string;
    iconName: CryptoIconName;
    onPress?: () => void;
    onPressActionButton?: () => void;
};

const selectableAssetContentStyle = prepareNativeStyle(() => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    marginLeft: 12,
}));

const cryptoIconStyle = prepareNativeStyle(utils => ({
    height: 48,
    width: 48,
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.colors.gray200,
}));

export const SelectableAssetItem = ({
    cryptoCurrencyName,
    cryptoCurrencySymbol,
    iconName,
    onPress,
    onPressActionButton,
}: SelectableAssetItemProps) => {
    const { applyStyle } = useNativeStyles();

    const { CurrencySymbolFormatter } = useFormatters();

    return (
        <TouchableOpacity disabled={!onPress} onPress={onPress}>
            <Box flexDirection="row" alignItems="center">
                <Box justifyContent="center" alignItems="center">
                    <Box
                        justifyContent="center"
                        alignItems="center"
                        style={applyStyle(cryptoIconStyle)}
                    >
                        <CryptoIcon name={iconName} />
                    </Box>
                </Box>
                <Box style={applyStyle(selectableAssetContentStyle)}>
                    <Box flex={1} justifyContent="space-between" alignItems="flex-start">
                        <Text>{cryptoCurrencyName}</Text>
                        <Box flexDirection="row" alignItems="center">
                            <Text variant="hint" color="gray600">
                                {CurrencySymbolFormatter.format(cryptoCurrencySymbol)}
                            </Text>
                        </Box>
                    </Box>
                    {onPressActionButton && (
                        <Box alignItems="flex-end">
                            <Button colorScheme="gray" size="small" onPress={onPressActionButton}>
                                Change
                            </Button>
                        </Box>
                    )}
                </Box>
            </Box>
        </TouchableOpacity>
    );
};
