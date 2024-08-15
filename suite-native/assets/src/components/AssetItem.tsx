import { memo } from 'react';
import { TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { CryptoIconName, CryptoIconWithPercentage, Icon } from '@suite-common/icons';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    DeviceRootState,
    FiatRatesRootState,
    selectVisibleDeviceAccountsByNetworkSymbol,
} from '@suite-common/wallet-core';
import { Badge, Box, Text } from '@suite-native/atoms';
import { CryptoAmountFormatter, FiatAmountFormatter } from '@suite-native/formatters';
import {
    AppTabsParamList,
    AppTabsRoutes,
    RootStackParamList,
    RootStackRoutes,
    TabToStackCompositeNavigationProp,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { isEthereumAccountSymbol } from '@suite-common/wallet-utils';
import { SettingsSliceRootState } from '@suite-native/settings';
import { selectNumberOfUniqueEthereumTokensPerDevice } from '@suite-native/ethereum-tokens';
import { Translation } from '@suite-native/intl';

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

const assetValuesStyle = prepareNativeStyle(_ => ({ maxWidth: '60%' }));

const iconStyle = prepareNativeStyle(() => ({
    marginRight: 6,
}));

const numberOfTokensStyle = prepareNativeStyle(() => ({
    marginLeft: 10,
}));

type NavigationType = TabToStackCompositeNavigationProp<
    AppTabsParamList,
    AppTabsRoutes.HomeStack,
    RootStackParamList
>;

export const AssetItem = memo(
    ({
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
        const navigation = useNavigation<NavigationType>();

        const accountsForNetworkSymbol = useSelector((state: AccountsRootState & DeviceRootState) =>
            selectVisibleDeviceAccountsByNetworkSymbol(state, cryptoCurrencySymbol),
        );
        const accountsPerAsset = accountsForNetworkSymbol.length;

        const numberOfTokens = useSelector(
            (
                state: AccountsRootState &
                    DeviceRootState &
                    FiatRatesRootState &
                    SettingsSliceRootState,
            ) => {
                if (isEthereumAccountSymbol(cryptoCurrencySymbol)) {
                    return selectNumberOfUniqueEthereumTokensPerDevice(state);
                }

                return 0;
            },
        );

        const handleAssetPress = () => {
            if (accountsPerAsset === 1) {
                navigation.navigate(RootStackRoutes.AccountDetail, {
                    accountKey: accountsForNetworkSymbol[0].key,
                    closeActionType: 'back',
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

                                {numberOfTokens > 0 && (
                                    <Badge
                                        style={applyStyle(numberOfTokensStyle)}
                                        size="small"
                                        label={
                                            <Translation
                                                id="accountList.numberOfTokens"
                                                values={{ numberOfTokens }}
                                            />
                                        }
                                    />
                                )}
                            </Box>
                        </Box>
                        <Box alignItems="flex-end" style={applyStyle(assetValuesStyle)}>
                            <FiatAmountFormatter
                                network={cryptoCurrencySymbol}
                                value={fiatBalance}
                            />
                            <CryptoAmountFormatter
                                value={cryptoCurrencyValue}
                                network={cryptoCurrencySymbol}
                                // Every asset crypto amount is rounded to 8 decimals to prevent UI overflow.
                                decimals={8}
                            />
                        </Box>
                    </Box>
                </Box>
            </TouchableOpacity>
        );
    },
);

AssetItem.displayName = 'AssetItem';
