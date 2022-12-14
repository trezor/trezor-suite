import React from 'react';

import {
    AccountsStackParamList,
    AccountsStackRoutes,
    Screen,
    ScreenContent,
    StackProps,
} from '@suite-native/navigation';
import { AccountsList } from '@suite-native/accounts';
import { nativeSpacings } from '@trezor/theme';

import { AccountsScreenHeader } from '../components/AccountsScreenHeader';

export const AccountsScreen = ({
    navigation,
}: StackProps<AccountsStackParamList, AccountsStackRoutes.Accounts>) => {
    const handleSelectAccount = (key: string) => {
        navigation.navigate(AccountsStackRoutes.AccountDetail, {
            accountKey: key,
        });
    };

    return (
        <Screen
            customHorizontalPadding={nativeSpacings.small}
            customVerticalPadding={nativeSpacings.small}
            header={<AccountsScreenHeader />}
            hasDivider
        >
            <ScreenContent>
                <AccountsList onSelectAccount={handleSelectAccount} />
            </ScreenContent>
        </Screen>
    );
};
