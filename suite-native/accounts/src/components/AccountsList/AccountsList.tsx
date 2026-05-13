import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';
import { atom, useSetAtom } from 'jotai';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { Card, VStack } from '@suite-native/atoms';
import { typedObjectEntries } from '@trezor/utils';

import { AccountsListEmptyPlaceholder } from './AccountsListEmptyPlaceholder';
import {
    type NativeAccountsRootState,
    selectFilteredDeviceAccountsGroupedByNetworkAccountType,
} from '../../selectors';
import { type OnSelectAccount } from '../../types';
import { TokenSelectBottomSheet } from '../TokenSelectBottomSheet';
import { AccountsListItem } from './AccountsListItem';

const DEFAULT_NETWORK_FILTER: NetworkSymbol[] = [];

type AccountsListProps = {
    onSelectAccount: OnSelectAccount;
    searchValue?: string;
    hideTokensIntoModal?: boolean;
    isStakingPressable?: boolean;
    isSendFlow?: boolean;
    networkFilter?: NetworkSymbol[];
};

export const AccountsList = ({
    onSelectAccount,
    searchValue = '',
    hideTokensIntoModal = false,
    isStakingPressable = false,
    isSendFlow = false,
    networkFilter = DEFAULT_NETWORK_FILTER,
}: AccountsListProps) => {
    const groupedAccounts = useSelector((state: NativeAccountsRootState) =>
        selectFilteredDeviceAccountsGroupedByNetworkAccountType(
            state,
            searchValue,
            isSendFlow,
            networkFilter,
        ),
    );
    const groups = useMemo(() => typedObjectEntries(groupedAccounts), [groupedAccounts]);
    const bottomSheetAccountAtom = useMemo(() => atom<Account | null>(null), []);
    const setBottomSheetAccountAtom = useSetAtom(bottomSheetAccountAtom);

    const handleSetBottomSheetAccount: OnSelectAccount = useCallback(
        params => {
            const { account, hasAnyKnownTokens, hasStaking } = params;
            if ((hasAnyKnownTokens || hasStaking) && hideTokensIntoModal) {
                setBottomSheetAccountAtom(account);

                return;
            }
            onSelectAccount(params);
        },
        [hideTokensIntoModal, onSelectAccount, setBottomSheetAccountAtom],
    );

    if (A.isEmpty(groups))
        return <AccountsListEmptyPlaceholder isFilterEmpty={!searchValue?.length} />;

    return (
        <>
            <VStack marginTop="sp8" spacing="sp16">
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
