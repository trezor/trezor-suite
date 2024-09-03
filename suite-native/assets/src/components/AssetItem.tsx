import { memo } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { useFormatters } from '@suite-common/formatters';
import { CryptoIconName, CryptoIconWithPercentage, Icon } from '@suite-common/icons-deprecated';
import { useSelectorDeepComparison } from '@suite-common/redux-utils';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountsRootState, DeviceRootState, FiatRatesRootState } from '@suite-common/wallet-core';
import { Badge, Box, Text } from '@suite-native/atoms';
import { CryptoAmountFormatter, FiatAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import {
    AppTabsParamList,
    AppTabsRoutes,
    RootStackParamList,
    RootStackRoutes,
    TabToStackCompositeNavigationProp,
} from '@suite-native/navigation';
import { SettingsSliceRootState } from '@suite-native/settings';
import { selectNumberOfUniqueTokensForCoinPerDevice } from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { AccountListItemBase } from '@suite-native/accounts';

import { selectVisibleDeviceAccountsKeysByNetworkSymbol } from '../assetsSelectors';

type AssetItemProps = {
    cryptoCurrencySymbol: NetworkSymbol;
    cryptoCurrencyValue: string;
    iconName: CryptoIconName;
    onPress?: (symbol: NetworkSymbol) => void;
    fiatBalance: string | null;
    fiatPercentage: number;
    fiatPercentageOffset: number;
};

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
        iconName,
        fiatBalance,
        fiatPercentage,
        fiatPercentageOffset,
        onPress,
    }: AssetItemProps) => {
        const { applyStyle } = useNativeStyles();
        const navigation = useNavigation<NavigationType>();
        const { NetworkNameFormatter } = useFormatters();
        const accountsKeysForNetworkSymbol = useSelectorDeepComparison(
            (state: AccountsRootState & DeviceRootState) =>
                selectVisibleDeviceAccountsKeysByNetworkSymbol(state, cryptoCurrencySymbol),
        );
        const accountsPerAsset = accountsKeysForNetworkSymbol.length;
        const numberOfTokens = useSelector(
            (
                state: AccountsRootState &
                    DeviceRootState &
                    FiatRatesRootState &
                    SettingsSliceRootState,
            ) => selectNumberOfUniqueTokensForCoinPerDevice(state, cryptoCurrencySymbol),
        );

        const handleAssetPress = () => {
            if (accountsPerAsset === 1 && numberOfTokens === 0) {
                navigation.navigate(RootStackRoutes.AccountDetail, {
                    accountKey: accountsKeysForNetworkSymbol[0],
                    closeActionType: 'back',
                });
            } else if (onPress) {
                onPress(cryptoCurrencySymbol);
            }
        };

        return (
            <AccountListItemBase
                disabled={!onPress}
                onPress={handleAssetPress}
                icon={
                    <CryptoIconWithPercentage
                        iconName={iconName}
                        percentage={fiatPercentage}
                        percentageOffset={fiatPercentageOffset}
                    />
                }
                title={<NetworkNameFormatter value={cryptoCurrencySymbol} />}
                badges={
                    <>
                        <Box>
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
                    </>
                }
                mainValue={
                    <FiatAmountFormatter network={cryptoCurrencySymbol} value={fiatBalance} />
                }
                secondaryValue={
                    <CryptoAmountFormatter
                        value={cryptoCurrencyValue}
                        network={cryptoCurrencySymbol}
                        // Every asset crypto amount is rounded to 8 decimals to prevent UI overflow.

                        decimals={8}
                    />
                }
            />
        );
    },
);

AssetItem.displayName = 'AssetItem';
