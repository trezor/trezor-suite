import { useSelector } from 'react-redux';
import { useCallback, useMemo } from 'react';

import { D } from '@mobily/ts-belt';
import { atom, useSetAtom } from 'jotai';

import { AccountsRootState, DeviceRootState, FiatRatesRootState } from '@suite-common/wallet-core';
import { SettingsSliceRootState } from '@suite-native/settings';
import { Account } from '@suite-common/wallet-types';

import { selectFilteredDeviceAccountsGroupedByNetworkAccountType } from '../selectors';
import { AccountListPlaceholder } from './AccountListPlaceholder';
import { GroupedByTypeAccountsList } from './GroupedAccountsList';
import { OnSelectAccount } from '../types';
import { TokenSelectBottomSheet } from './TokenSelectBottomSheet';

type AccountsListProps = {
    onSelectAccount: OnSelectAccount;
    filterValue?: string;
    hideTokensIntoModal?: boolean;
};

export const AccountsList = ({
    onSelectAccount,
    filterValue = '',
    hideTokensIntoModal = false,
}: AccountsListProps) => {
    const groupedAccounts = useSelector(
        (
            state: AccountsRootState &
                FiatRatesRootState &
                SettingsSliceRootState &
                DeviceRootState,
        ) => selectFilteredDeviceAccountsGroupedByNetworkAccountType(state, filterValue),
    );
    const bottomSheetAccountAtom = useMemo(() => atom<Account | null>(null), []);
    const setBottomSheetAccountAtom = useSetAtom(bottomSheetAccountAtom);

    const handleSetBottomSheetAccount: OnSelectAccount = useCallback(
        params => {
            const { account, hasAnyTokensWithFiatRates } = params;
            if (hasAnyTokensWithFiatRates && hideTokensIntoModal) {
                setBottomSheetAccountAtom(account);

                return;
            }
            onSelectAccount(params);
        },
        [hideTokensIntoModal, onSelectAccount, setBottomSheetAccountAtom],
    );

    if (D.isEmpty(groupedAccounts))
        return <AccountListPlaceholder isFilterEmpty={!filterValue?.length} />;

    return (
        <>
            <GroupedByTypeAccountsList
                groupedAccounts={groupedAccounts}
                onSelectAccount={handleSetBottomSheetAccount}
                hideTokens={hideTokensIntoModal}
            />
            <TokenSelectBottomSheet
                bottomSheetAccountAtom={bottomSheetAccountAtom}
                onSelectAccount={onSelectAccount}
            />
        </>
    );
};
