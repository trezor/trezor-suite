import React from 'react';
import { TouchableOpacity } from 'react-native';

import { CryptoIcon, CryptoIconName } from '@trezor/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { useFormatters } from '@suite-common/formatters';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { Box, Text } from '@suite-native/atoms';

type AssetItemProps = {
    cryptoCurrencySymbol: NetworkSymbol;
    cryptoCurrencyName: string;
    cryptoCurrencyValue: string;
    iconName: CryptoIconName;
    onPress?: () => void;
    fiatBalance: string;
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

export const AssetItem = ({
    cryptoCurrencySymbol,
    cryptoCurrencyValue,
    cryptoCurrencyName,
    iconName,
    fiatBalance,
    onPress,
}: AssetItemProps) => {
    const { applyStyle } = useNativeStyles();
    const { CryptoAmountFormatter, CurrencySymbolFormatter, FiatAmountFormatter } = useFormatters();

    return (
        <TouchableOpacity disabled={!onPress} onPress={onPress}>
            <Box style={applyStyle(assetItemWrapperStyle)}>
                <CryptoIcon name={iconName} size="large" />
                <Box style={applyStyle(assetContentStyle)}>
                    <Box
                        flexDirection="row"
                        flex={1}
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <Text>{cryptoCurrencyName}</Text>
                    </Box>
                    <Box alignItems="flex-end">
                        <Text>{FiatAmountFormatter.format(fiatBalance)}</Text>
                        <Text variant="hint" color="gray600">
                            <>{`${CryptoAmountFormatter.format(cryptoCurrencyValue, {
                                symbol: cryptoCurrencySymbol,
                            })} ${CurrencySymbolFormatter.format(cryptoCurrencySymbol)}`}</>
                        </Text>
                    </Box>
                </Box>
            </Box>
        </TouchableOpacity>
    );
};
