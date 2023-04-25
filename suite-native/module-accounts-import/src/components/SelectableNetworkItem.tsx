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
    onPress?: (networkSymbol: NetworkSymbol) => void;
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
    backgroundColor: utils.colors.backgroundSurfaceElevation2,
    justifyContent: 'center',
    alignItems: 'center',
}));

export const SelectableNetworkItem = ({
    cryptoCurrencyName,
    cryptoCurrencySymbol,
    iconName,
    onPress,
    onPressActionButton,
}: SelectableAssetItemProps) => {
    const { applyStyle } = useNativeStyles();
    const { NetworkSymbolFormatter } = useFormatters();

    const handlePress = () => {
        if (!onPress) return;
        onPress(cryptoCurrencySymbol);
    };

    return (
        <TouchableOpacity disabled={!onPress} onPress={handlePress}>
            <Box flexDirection="row" alignItems="center">
                <Box justifyContent="center" alignItems="center">
                    <Box style={applyStyle(cryptoIconStyle)}>
                        <CryptoIcon name={iconName} />
                    </Box>
                </Box>
                <Box style={applyStyle(selectableAssetContentStyle)}>
                    <Box flex={1} justifyContent="space-between" alignItems="flex-start">
                        <Text variant="body">{cryptoCurrencyName}</Text>
                        <Box flexDirection="row" alignItems="center">
                            <Text variant="hint" color="textSubdued">
                                <NetworkSymbolFormatter value={cryptoCurrencySymbol} />
                            </Text>
                        </Box>
                    </Box>
                    {onPressActionButton && (
                        <Box alignItems="flex-end">
                            <Button
                                data-testID="@onboarding/sync-coins/change"
                                colorScheme="tertiaryElevation1"
                                size="small"
                                onPress={onPressActionButton}
                            >
                                Change
                            </Button>
                        </Box>
                    )}
                </Box>
            </Box>
        </TouchableOpacity>
    );
};
