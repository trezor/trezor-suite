import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Card, VStack } from '@suite-native/atoms';
import { typedObjectEntries } from '@trezor/utils';

import { AccountsListEmptyPlaceholder } from './AccountsListEmptyPlaceholder';
import { AccountsListItem } from './AccountsListItem';
import {
    type NativeAccountsRootState,
    selectFilteredDeviceAccountsGroupedByNetworkAccountType,
} from '../../selectors';
import { type OnSelectAccount } from '../../types';

const DEFAULT_NETWORK_FILTER: NetworkSymbol[] = [];

type AccountsListProps = {
    onSelectAccount: OnSelectAccount;
    searchValue?: string;
    isSendFlow?: boolean;
    networkFilter?: NetworkSymbol[];
};

export const AccountsList = ({
    onSelectAccount,
    searchValue = '',
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

    if (A.isEmpty(groups))
        return <AccountsListEmptyPlaceholder isFilterEmpty={!searchValue?.length} />;

    return (
        <VStack marginTop="sp8" spacing="sp16">
            {groups.map(([accountTypeHeader, networkAccounts]) => (
                <Card key={accountTypeHeader} noPadding>
                    {networkAccounts.map(account => (
                        <AccountsListItem
                            key={account.key}
                            account={account}
                            onPress={onSelectAccount}
                        />
                    ))}
                </Card>
            ))}
        </VStack>
    );
};
