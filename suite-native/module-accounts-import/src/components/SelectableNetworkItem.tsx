import React from 'react';
import { TouchableOpacity } from 'react-native';

import { CryptoIconName } from '@suite-common/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Button, RoundedIcon, Text } from '@suite-native/atoms';
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
                <RoundedIcon name={iconName} />
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
