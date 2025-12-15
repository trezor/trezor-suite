import { memo } from 'react';
import { useSelector } from 'react-redux';

import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';

import type { AccountsRootState, DeviceRootState } from '@suite-common/wallet-core';
import {
    selectAccountByKey,
    selectDeviceAccountKeyForNetworkSymbolAndAccountTypeWithIndex,
} from '@suite-common/wallet-core';
import type { RootStackParamList, RootStackRoutes } from '@suite-native/navigation';

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

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    return account ? (
        <AccountDetailContentScreen account={account} tokenContract={tokenContract} />
    ) : (
        <AccountDetailLoadingScreen />
    );
});
