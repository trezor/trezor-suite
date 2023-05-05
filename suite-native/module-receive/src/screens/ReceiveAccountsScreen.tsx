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
import { AccountKey, TokenSymbol } from '@suite-common/wallet-types';

export const ReceiveAccountsScreen = () => {
    const navigation =
        useNavigation<
            StackNavigationProps<ReceiveStackParamList, ReceiveStackRoutes.ReceiveAccounts>
        >();

    const navigateToReceiveScreen = (accountKey: AccountKey, tokenSymbol?: TokenSymbol) =>
        navigation.navigate(ReceiveStackRoutes.Receive, { accountKey, tokenSymbol });

    return (
        <Screen header={<ScreenHeader content="Receive to" hasGoBackIcon={false} />}>
            <AccountsList onSelectAccount={navigateToReceiveScreen} />
        </Screen>
    );
};
