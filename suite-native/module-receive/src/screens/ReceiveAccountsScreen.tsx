import React from 'react';

import { useNavigation } from '@react-navigation/native';

import { AccountsList } from '@suite-native/accounts';
import {
    Screen,
    ScreenHeader,
    ReceiveStackParamList,
    ReceiveStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';

export const ReceiveAccountsScreen = () => {
    const navigation =
        useNavigation<
            StackNavigationProps<ReceiveStackParamList, ReceiveStackRoutes.ReceiveAccounts>
        >();

    const navigateToReceiveScreen = (accountKey: AccountKey, tokenContract?: TokenAddress) =>
        navigation.navigate(ReceiveStackRoutes.Receive, { accountKey, tokenContract });

    return (
        <Screen header={<ScreenHeader content="Receive to" hasGoBackIcon={false} />}>
            <AccountsList onSelectAccount={navigateToReceiveScreen} />
        </Screen>
    );
};
