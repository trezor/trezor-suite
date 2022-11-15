import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

import { CryptoIcon, CryptoIconName, Icon } from '@trezor/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { useFormatters } from '@suite-common/formatters';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { Box, Text } from '@suite-native/atoms';
import { AccountsRootState, selectAccountsAmountPerSymbol } from '@suite-common/wallet-core';

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

const iconStyle = prepareNativeStyle(() => ({
    marginRight: 6,
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
    const accountsPerAsset = useSelector((state: AccountsRootState) =>
        selectAccountsAmountPerSymbol(state, cryptoCurrencySymbol),
    );
    const { CryptoAmountFormatter, FiatAmountFormatter } = useFormatters();

    return (
        <TouchableOpacity disabled={!onPress} onPress={onPress}>
            <Box style={applyStyle(assetItemWrapperStyle)}>
                <CryptoIcon name={iconName} size="large" />
                <Box style={applyStyle(assetContentStyle)}>
                    <Box flex={1} justifyContent="space-between" alignItems="flex-start">
                        <Text>{cryptoCurrencyName}</Text>
                        <Box flexDirection="row" alignItems="center">
                            <Box style={applyStyle(iconStyle)}>
                                <Icon size="medium" color="gray600" name="standardWallet" />
                            </Box>
                            <Text variant="hint" color="gray600">
                                {accountsPerAsset}
                            </Text>
                        </Box>
                    </Box>
                    <Box alignItems="flex-end">
                        <Text>{FiatAmountFormatter.format(fiatBalance)}</Text>
                        <Text variant="hint" color="gray600">
                            {CryptoAmountFormatter.format(cryptoCurrencyValue, {
                                symbol: cryptoCurrencySymbol,
                            })}
                        </Text>
                    </Box>
                </Box>
            </Box>
        </TouchableOpacity>
    );
};
