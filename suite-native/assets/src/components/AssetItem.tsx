import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

import { CryptoIconName, CryptoIconWithPercentage, Icon } from '@trezor/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { useFormatters } from '@suite-common/formatters';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { Box, DiscreetText, Text } from '@suite-native/atoms';
import { AccountsRootState, selectAccountsAmountPerSymbol } from '@suite-common/wallet-core';

type AssetItemProps = {
    cryptoCurrencySymbol: NetworkSymbol;
    cryptoCurrencyName: string;
    cryptoCurrencyValue: string;
    iconName: CryptoIconName;
    onPress?: () => void;
    fiatBalance: string;
    fiatPercentage: number;
    fiatPercentageOffset: number;
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
    fiatPercentage,
    fiatPercentageOffset,
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
                <CryptoIconWithPercentage
                    iconName={iconName}
                    percentage={fiatPercentage}
                    percentageOffset={fiatPercentageOffset}
                />
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
                        <DiscreetText>{FiatAmountFormatter.format(fiatBalance)}</DiscreetText>
                        <DiscreetText color="gray600" typography="hint">
                            {CryptoAmountFormatter.format(cryptoCurrencyValue, {
                                symbol: cryptoCurrencySymbol,
                            })}
                        </DiscreetText>
                    </Box>
                </Box>
            </Box>
        </TouchableOpacity>
    );
};
