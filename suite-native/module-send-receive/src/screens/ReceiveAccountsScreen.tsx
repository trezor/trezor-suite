import React from 'react';

import { AccountsList } from '@suite-native/accounts';
import {
    Screen,
    ScreenHeader,
    SendReceiveStackParamList,
    SendReceiveStackRoutes,
    StackProps,
} from '@suite-native/navigation';
import { AccountKey } from '@suite-common/wallet-types';
import { EthereumTokenSymbol } from '@suite-native/ethereum-tokens';

export const ReceiveAccountsScreen = ({
    navigation,
}: StackProps<SendReceiveStackParamList, SendReceiveStackRoutes.ReceiveAccounts>) => {
    const navigateToReceiveScreen = (accountKey: AccountKey, tokenSymbol?: EthereumTokenSymbol) =>
        navigation.navigate(SendReceiveStackRoutes.Receive, { accountKey, tokenSymbol });

    return (
        <Screen header={<ScreenHeader content="Receive to" hasGoBackIcon={false} />}>
            <AccountsList onSelectAccount={navigateToReceiveScreen} />
        </Screen>
    );
};
