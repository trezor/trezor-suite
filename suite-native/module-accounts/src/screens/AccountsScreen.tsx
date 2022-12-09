import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';

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
import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import { AccountsList } from '@suite-native/accounts';
import { selectAccountsSymbols } from '@suite-common/wallet-core';

const assetsFilterStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: utils.borders.radii.round,
    marginBottom: utils.spacings.medium,
}));

const assetsFilterItemStyle = prepareNativeStyle(utils => ({
    marginRight: utils.spacings.small,
    marginBottom: utils.spacings.small,
}));

export const AccountsScreen = ({
    route,
}: StackProps<AccountsStackParamList, AccountsStackRoutes.Accounts>) => {
    const { applyStyle } = useNativeStyles();
    const [selectedAssets, setSelectedAssets] = useState<NetworkSymbol[]>([]);
    const accountsSymbols = useSelector(selectAccountsSymbols);
    const navigation =
        useNavigation<StackNavigationProps<AccountsStackParamList, AccountsStackRoutes.Accounts>>();

    const handleScreenFocus = useCallback(() => {
        const { networkSymbol } = route.params;

        if (networkSymbol) {
            setSelectedAssets([networkSymbol]);
        }

        return () => {
            setSelectedAssets([]);
        };
    }, [route.params]);

    useFocusEffect(handleScreenFocus);

    const handleSelectAsset = (networkSymbol: NetworkSymbol) => {
        setSelectedAssets(assets => {
            if (assets.includes(networkSymbol)) {
                return assets.filter(asset => asset !== networkSymbol);
            }
            return [...assets, networkSymbol];
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
                {accountsSymbols.map(accountSymbol => (
                    <Chip
                        key={accountSymbol}
                        icon={<CryptoIcon name={accountSymbol} />}
                        onSelect={() => handleSelectAsset(accountSymbol)}
                        title={networks[accountSymbol].name}
                        isSelected={selectedAssets.includes(accountSymbol)}
                        style={applyStyle(assetsFilterItemStyle)}
                    />
                ))}
            </View>
            <AccountsList assets={selectedAssets} onSelectAccount={handleSelectAccount} />
        </Screen>
    );
};
