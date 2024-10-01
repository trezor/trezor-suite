import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';
import { atom, useSetAtom } from 'jotai';

import { Account } from '@suite-common/wallet-types';
import { Card, VStack } from '@suite-native/atoms';

import {
    NativeAccountsRootState,
    selectFilteredDeviceAccountsGroupedByNetworkAccountType,
} from '../../selectors';
import { OnSelectAccount } from '../../types';
import { AccountsListEmptyPlaceholder } from './AccountsListEmptyPlaceholder';
import { TokenSelectBottomSheet } from '../TokenSelectBottomSheet';
import { AccountsListItem } from './AccountsListItem';

type AccountsListProps = {
    onSelectAccount: OnSelectAccount;
    filterValue?: string;
    hideTokensIntoModal?: boolean;
    isStakingPressable?: boolean;
};

export const AccountsList = ({
    onSelectAccount,
    filterValue = '',
    hideTokensIntoModal = false,
    isStakingPressable = false,
}: AccountsListProps) => {
    const groupedAccounts = useSelector((state: NativeAccountsRootState) =>
        selectFilteredDeviceAccountsGroupedByNetworkAccountType(state, filterValue),
    );
    const groups = useMemo(() => {
        return Object.entries(groupedAccounts);
    }, [groupedAccounts]);
    const bottomSheetAccountAtom = useMemo(() => atom<Account | null>(null), []);
    const setBottomSheetAccountAtom = useSetAtom(bottomSheetAccountAtom);

    const handleSetBottomSheetAccount: OnSelectAccount = useCallback(
        params => {
            const { account, hasAnyKnownTokens } = params;
            if (hasAnyKnownTokens && hideTokensIntoModal) {
                setBottomSheetAccountAtom(account);

                return;
            }
            onSelectAccount(params);
        },
        [hideTokensIntoModal, onSelectAccount, setBottomSheetAccountAtom],
    );

    if (A.isEmpty(groups))
        return <AccountsListEmptyPlaceholder isFilterEmpty={!filterValue?.length} />;

    return (
        <>
            <VStack spacing="sp16" paddingBottom="sp16">
                {groups.map(([accountTypeHeader, networkAccounts]) => (
                    <Card key={accountTypeHeader} noPadding>
                        {networkAccounts.map(account => (
                            <AccountsListItem
                                key={account.key}
                                account={account}
                                onPress={handleSetBottomSheetAccount}
                            />
                        ))}
                    </Card>
                ))}
            </VStack>
            <TokenSelectBottomSheet
                bottomSheetAccountAtom={bottomSheetAccountAtom}
                onSelectAccount={onSelectAccount}
                isStakingPressable={isStakingPressable}
            />
        </>
    );
};
