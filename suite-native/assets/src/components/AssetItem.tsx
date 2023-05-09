import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { CryptoIconName, CryptoIconWithPercentage, Icon } from '@suite-common/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { Box, Text } from '@suite-native/atoms';
import {
    AccountsRootState,
    selectAccountsAmountPerSymbol,
    selectAccountsByNetworkAndDevice,
} from '@suite-common/wallet-core';
import { CryptoAmountFormatter, FiatAmountFormatter } from '@suite-native/formatters';
import {
    AppTabsParamList,
    AppTabsRoutes,
    RootStackParamList,
    RootStackRoutes,
    TabToStackCompositeNavigationProp,
} from '@suite-native/navigation';
import { HIDDEN_DEVICE_STATE } from '@suite-native/module-devices';

type AssetItemProps = {
    cryptoCurrencySymbol: NetworkSymbol;
    cryptoCurrencyName: string;
    cryptoCurrencyValue: string;
    iconName: CryptoIconName;
    onPress?: (symbol: NetworkSymbol) => void;
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
    const navigation =
        useNavigation<
            TabToStackCompositeNavigationProp<
                AppTabsParamList,
                AppTabsRoutes.HomeStack,
                RootStackParamList
            >
        >();
    const accountsPerAsset = useSelector((state: AccountsRootState) =>
        selectAccountsAmountPerSymbol(state, cryptoCurrencySymbol),
    );
    const accountsForNetworkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountsByNetworkAndDevice(state, HIDDEN_DEVICE_STATE, cryptoCurrencySymbol),
    );

    const handleAssetPress = () => {
        if (accountsPerAsset === 1) {
            navigation.navigate(RootStackRoutes.AccountDetail, {
                accountKey: accountsForNetworkSymbol[0].key,
            });
        } else if (onPress) {
            onPress(cryptoCurrencySymbol);
        }
    };

    return (
        <TouchableOpacity disabled={!onPress} onPress={handleAssetPress}>
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
                                <Icon size="medium" color="iconSubdued" name="standardWallet" />
                            </Box>
                            <Text variant="hint" color="textSubdued">
                                {accountsPerAsset}
                            </Text>
                        </Box>
                    </Box>
                    <Box alignItems="flex-end">
                        <FiatAmountFormatter network={cryptoCurrencySymbol} value={fiatBalance} />
                        <CryptoAmountFormatter
                            value={cryptoCurrencyValue}
                            network={cryptoCurrencySymbol}
                        />
                    </Box>
                </Box>
            </Box>
        </TouchableOpacity>
    );
};
