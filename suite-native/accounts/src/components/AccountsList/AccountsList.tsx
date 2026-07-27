import React from 'react';
import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { VStack } from '@suite-native/atoms';

import { AccountsListEmptyPlaceholder } from './AccountsListEmptyPlaceholder';
import { AccountsListNetworkGroup } from './AccountsListNetworkGroup';
import { type NativeAccountsRootState, selectFilteredDeviceNetworkSymbols } from '../../selectors';
import { type OnSelectAccount } from '../../types';

const DEFAULT_NETWORK_FILTER: NetworkSymbol[] = [];

type AccountsListComponentProps = {
    onSelectAccount: OnSelectAccount;
    searchValue?: string;
    isSendFlow?: boolean;
    networkFilter?: NetworkSymbol[];
};

export const AccountsListComponent = ({
    onSelectAccount,
    searchValue = '',
    isSendFlow = false,
    networkFilter = DEFAULT_NETWORK_FILTER,
}: AccountsListComponentProps) => {
    const networkSymbols = useSelector((state: NativeAccountsRootState) =>
        selectFilteredDeviceNetworkSymbols(state, searchValue, isSendFlow, networkFilter),
    );

    if (A.isEmpty(networkSymbols))
        return <AccountsListEmptyPlaceholder isFilterEmpty={!searchValue?.length} />;

    return (
        <VStack marginTop="sp8" spacing="sp16">
            {networkSymbols.map(networkSymbol => (
                <AccountsListNetworkGroup
                    key={networkSymbol}
                    networkSymbol={networkSymbol}
                    searchValue={searchValue}
                    isSendFlow={isSendFlow}
                    onSelectAccount={onSelectAccount}
                />
            ))}
        </VStack>
    );
};

export const AccountsList = React.memo(AccountsListComponent);

AccountsList.displayName = 'AccountsList';
