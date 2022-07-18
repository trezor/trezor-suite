import React from 'react';

import { CryptoIcon, CryptoIconName } from '@trezor/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from './Box';
import { Text } from './Text';
import { ProgressBar } from './ProgressBar';

type AssetItemProps = {
    cryptoCurrencySymbol: string;
    cryptoCurrencyName: string;
    cryptoCurrencyValue: number;
    portfolioPercentage: number;
    fiatCurrencyValue: number;
    iconName: CryptoIconName;
};

const assetItemWrapperStyle = prepareNativeStyle(() => ({
    flexDirection: 'row',
    alignItems: 'center',
}));

const assetContentStyle = prepareNativeStyle(() => ({
    justifyContent: 'space-between',
    flex: 1,
    marginLeft: 10,
}));

const FIAT_CURRENCY_VALUE = '$'; // NOTE: Temporary. Will be used from selector and wallet settings

export const AssetItem = ({
    cryptoCurrencySymbol,
    cryptoCurrencyValue,
    portfolioPercentage,
    fiatCurrencyValue,
    cryptoCurrencyName,
    iconName,
}: AssetItemProps) => {
    const { applyStyle } = useNativeStyles();

    return (
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
                    <Text>
                        {FIAT_CURRENCY_VALUE} {fiatCurrencyValue}
                    </Text>
                </Box>
                <Box
                    flexDirection="row"
                    flex={1}
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <ProgressBar value={portfolioPercentage} />
                    <Text variant="hint" color="gray600">
                        {cryptoCurrencyValue} {cryptoCurrencySymbol}
                    </Text>
                </Box>
            </Box>
        </Box>
    );
};
