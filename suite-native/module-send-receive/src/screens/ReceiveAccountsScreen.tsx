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

export const ReceiveAccountsScreen = ({
    navigation,
}: StackProps<SendReceiveStackParamList, SendReceiveStackRoutes.ReceiveAccounts>) => {
    const navigateToReceiveScreen = (accountKey: AccountKey) =>
        navigation.navigate(SendReceiveStackRoutes.Receive, { accountKey });

    return (
        <Screen header={<ScreenHeader content="Receive to" hasGoBackIcon={false} />}>
            <AccountsList onSelectAccount={navigateToReceiveScreen} areTokensDisplayed={false} />
        </Screen>
    );
};
