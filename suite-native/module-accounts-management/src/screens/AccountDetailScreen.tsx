import { memo } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';

import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { useResolvedAccountKey } from '@suite-native/accounts';
import { type RootStackParamList, type RootStackRoutes } from '@suite-native/navigation';

import { AccountDetailContentScreen } from './AccountDetailContentScreen';
import { AccountDetailLoadingScreen } from './AccountDetailLoadingScreen';

export const AccountDetailScreen = memo(() => {
    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.AccountDetail>>();
    const navigation =
        useNavigation<
            NativeStackNavigationProp<RootStackParamList, RootStackRoutes.AccountDetail>
        >();
    const {
        accountKey: routeAccountKey,
        tokenContract,
        networkSymbol,
        accountType,
        accountIndex,
    } = route.params;

    const accountKey = useResolvedAccountKey({
        accountKey: routeAccountKey,
        networkSymbol,
        accountType,
        accountIndex,
        setParams: navigation.setParams,
    });

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    return account ? (
        <AccountDetailContentScreen account={account} tokenContract={tokenContract} />
    ) : (
        <AccountDetailLoadingScreen />
    );
});
