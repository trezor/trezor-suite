import React, { useCallback, useState } from 'react';
import { View } from 'react-native';

import { useFocusEffect, useNavigation } from '@react-navigation/native';

import {
    AccountsStackParamList,
    AccountsStackRoutes,
    Screen,
    StackNavigationProps,
    StackProps,
} from '@suite-native/navigation';
import { Chip } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { CryptoIcon } from '@trezor/icons';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountsList } from '@suite-native/accounts';

const assetsFilterStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    borderRadius: utils.borders.radii.round,
    marginBottom: utils.spacings.medium,
}));

const assetsFilterItemStyle = prepareNativeStyle(utils => ({
    marginRight: utils.spacings.small,
}));

export const AccountsScreen = ({
    route,
}: StackProps<AccountsStackParamList, AccountsStackRoutes.Accounts>) => {
    const { applyStyle } = useNativeStyles();
    const [selectedAssets, setSelectedAssets] = useState<NetworkSymbol[]>([]);
    const navigation =
        useNavigation<StackNavigationProps<AccountsStackParamList, AccountsStackRoutes.Accounts>>();

    const handleScreenFocus = useCallback(() => {
        const { currencySymbol } = route.params;

        if (currencySymbol) {
            setSelectedAssets([currencySymbol]);
        }

        return () => {
            setSelectedAssets([]);
        };
    }, [route.params]);

    useFocusEffect(handleScreenFocus);

    const handleSelectAsset = (currencySymbol: NetworkSymbol) => {
        setSelectedAssets(assets => {
            if (assets.includes(currencySymbol)) {
                return assets.filter(asset => asset !== currencySymbol);
            }
            return [...assets, currencySymbol];
        });
    };

    const handleSelectAccount = (key: string) => {
        navigation.navigate(AccountsStackRoutes.AccountDetail, {
            accountKey: key,
        });
    };

    return (
        <Screen>
            <View style={[applyStyle(assetsFilterStyle)]}>
                <Chip
                    icon={<CryptoIcon name="test" />}
                    onSelect={() => handleSelectAsset('test')}
                    title="testnet"
                    isSelected={selectedAssets.includes('test')}
                    style={applyStyle(assetsFilterItemStyle)}
                />
                <Chip
                    icon={<CryptoIcon name="btc" />}
                    onSelect={() => handleSelectAsset('btc')}
                    title="btc"
                    isSelected={selectedAssets.includes('btc')}
                    style={applyStyle(assetsFilterItemStyle)}
                />
            </View>
            <AccountsList assets={selectedAssets} onSelectAccount={handleSelectAccount} />
        </Screen>
    );
};
