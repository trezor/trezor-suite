import { memo } from 'react';
import { useSelector } from 'react-redux';

import { RouteProp, useRoute } from '@react-navigation/native';

import {
    AccountsRootState,
    DeviceRootState,
    selectDeviceAccountKeyForNetworkSymbolAndAccountTypeWithIndex,
} from '@suite-common/wallet-core';
import { RootStackParamList, RootStackRoutes } from '@suite-native/navigation';

import { AccountDetailContentScreen } from './AccountDetailContentScreen';
import { AccountDetailLoadingScreen } from './AccountDetailLoadingScreen';

export const AccountDetailScreen = memo(() => {
    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.AccountDetail>>();
    const {
        accountKey: routeAccountKey,
        tokenContract,
        networkSymbol,
        accountType,
        accountIndex,
    } = route.params;

    const foundAccountKey = useSelector((state: AccountsRootState & DeviceRootState) =>
        selectDeviceAccountKeyForNetworkSymbolAndAccountTypeWithIndex(
            state,
            networkSymbol,
            accountType,
            accountIndex,
        ),
    );

    const accountKey = routeAccountKey ?? foundAccountKey;

    return accountKey ? (
        <AccountDetailContentScreen accountKey={accountKey} tokenContract={tokenContract} />
    ) : (
        <AccountDetailLoadingScreen />
    );
});
