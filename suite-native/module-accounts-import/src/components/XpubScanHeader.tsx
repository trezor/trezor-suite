import React from 'react';
import { View } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Chip, Text } from '@suite-native/atoms';
import { CryptoIcon } from '@trezor/icons';
import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import { enabledNetworks } from '@suite-native/config';

type XpubScanHeaderProps = {
    onSelectCurrency: (currencySymbol: NetworkSymbol) => void;
    selectedCurrencySymbol: NetworkSymbol;
};

const chipsWrapperStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    borderRadius: utils.borders.radii.large,
    backgroundColor: utils.colors.gray200,
}));

const chipStyle = prepareNativeStyle<{ isSelected: boolean }>((utils, { isSelected }) => ({
    ...utils.typography.label,
    flex: 1,
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderRadius: utils.borders.radii.large,
    extend: {
        condition: isSelected,
        style: {
            backgroundColor: utils.colors.gray0,
        },
    },
}));

export const XpubScanHeader = ({
    onSelectCurrency,
    selectedCurrencySymbol,
}: XpubScanHeaderProps) => {
    const { applyStyle } = useNativeStyles();
    return (
        <Box alignItems="center" marginBottom="large">
            <Box marginBottom="medium">
                <Text variant="titleMedium">XPUB Import</Text>
            </Box>
            <View style={applyStyle(chipsWrapperStyle)}>
                {enabledNetworks.map(network => (
                    <Chip
                        key={network}
                        icon={<CryptoIcon name={network} />}
                        title={networks[network].name}
                        titleColor="gray600"
                        onSelect={() => onSelectCurrency(network)}
                        style={applyStyle(chipStyle, {
                            isSelected: selectedCurrencySymbol === network,
                        })}
                        isSelected={selectedCurrencySymbol === network}
                    />
                ))}
            </View>
        </Box>
    );
};
