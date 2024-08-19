import { useMemo, useState } from 'react';

import { useNavigation } from '@react-navigation/native';
import { atom, useSetAtom } from 'jotai';

import { Account } from '@suite-common/wallet-types';
import {
    AccountsList,
    OnSelectAccount,
    SearchableAccountsListScreenHeader,
} from '@suite-native/accounts';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import {
    RootStackParamList,
    RootStackRoutes,
    Screen,
    StackNavigationProps,
} from '@suite-native/navigation';

import { TokenSelectBottomSheet } from './TokenSelectBottomSheet';

export const AccountsScreen = () => {
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.AccountDetail>>();

    const [accountsFilterValue, setAccountsFilterValue] = useState<string>('');
    const bottomSheetAccountAtom = useMemo(() => atom<Account | null>(null), []);
    const setBottomSheetAccountAtom = useSetAtom(bottomSheetAccountAtom);

    const handleSelectAccount: OnSelectAccount = ({ account, tokenContract }) => {
        navigation.navigate(RootStackRoutes.AccountDetail, {
            accountKey: account.key,
            tokenContract,
            closeActionType: 'back',
        });
    };

    const handleSetBottomSheetAccount: OnSelectAccount = ({
        account,
        tokenContract,
        hasAnyTokensWithFiatRates,
    }) => {
        if (hasAnyTokensWithFiatRates) {
            setBottomSheetAccountAtom(account);

            return;
        }
        handleSelectAccount({
            account,
            tokenContract,
            hasAnyTokensWithFiatRates,
        });
    };

    const handleFilterChange = (value: string) => {
        setAccountsFilterValue(value);
    };

    return (
        <Screen
            screenHeader={<DeviceManagerScreenHeader />}
            subheader={
                <SearchableAccountsListScreenHeader
                    title="My assets"
                    onSearchInputChange={handleFilterChange}
                    flowType="accounts"
                />
            }
        >
            <AccountsList
                onSelectAccount={handleSetBottomSheetAccount}
                filterValue={accountsFilterValue}
                hideTokens
            />
            <TokenSelectBottomSheet
                bottomSheetAccountAtom={bottomSheetAccountAtom}
                onSelectAccount={handleSelectAccount}
            />
        </Screen>
    );
};
