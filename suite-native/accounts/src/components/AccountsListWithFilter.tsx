import { type ReactNode, useCallback, useEffect, useState } from 'react';

import { useNavigation } from '@react-navigation/native';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AddCoinFlowType, type CloseActionType } from '@suite-native/navigation';

import { type NetworkFilterType, type OnSelectAccount } from '../types';
import { AccountsList } from './AccountsList/AccountsList';
import { AccountsListEmptyPlaceholder } from './AccountsList/AccountsListEmptyPlaceholder';
import { AccountsListFooter } from './AccountsListFooter';
import { SearchableAccountsListHeader } from './SearchableAccountsListHeader';

const EMPTY_NETWORKS_FILTER: NetworkSymbol[] = [];

type AccountsListWithFilterProps = {
    onSelectAccount: OnSelectAccount;
    title: ReactNode;
    flowType?: AddCoinFlowType;
    networksFilter?: NetworkSymbol[];
    closeActionType?: CloseActionType;
    closeAction?: () => void;
    onAddAccount?: () => void;
    networkFilterType: NetworkFilterType;
    noHeaderPaddingTop?: boolean;
    children?: ReactNode;
};

export const AccountsListWithFilter = ({
    onSelectAccount,
    title,
    flowType,
    networksFilter = EMPTY_NETWORKS_FILTER,
    closeActionType,
    closeAction,
    onAddAccount,
    networkFilterType,
    noHeaderPaddingTop,
    children,
}: AccountsListWithFilterProps) => {
    const [searchValue, setSearchValue] = useState('');
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [filteredNetworks, setFilteredNetworks] = useState<NetworkSymbol[]>(networksFilter);
    const networkFilter = { type: networkFilterType, filteredNetworks, setFilteredNetworks };

    useEffect(() => {
        setFilteredNetworks(networksFilter);
    }, [networksFilter]);

    const navigation = useNavigation();

    // Clear search only when the user actually switches tabs, not when navigating to an
    // account (which pushes a root-stack screen and blurs the whole tab navigator).
    // The tab navigator's 'state' event fires on tab switches but NOT on root-stack pushes.
    useEffect(() => {
        const tabParent = navigation.getParent();
        if (!tabParent) return;

        let prevTabIndex = tabParent.getState()?.index;

        const unsubscribe = tabParent.addListener('state', () => {
            const currentTabIndex = tabParent.getState()?.index;
            if (currentTabIndex !== prevTabIndex) {
                prevTabIndex = currentTabIndex;
                setIsSearchActive(false);
            }
        });

        return () => unsubscribe();
    }, [navigation]);

    const handleSelectAccount: OnSelectAccount = useCallback(
        params => {
            onSelectAccount(params);
        },
        [onSelectAccount],
    );

    return (
        <>
            <SearchableAccountsListHeader
                title={title}
                onSearchInputChange={setSearchValue}
                isSearchActive={isSearchActive}
                onSearchActiveChange={setIsSearchActive}
                flowType={flowType}
                closeActionType={closeActionType}
                closeAction={closeAction}
                onAddAccount={onAddAccount}
                networkFilter={networkFilter}
                noPaddingTop={noHeaderPaddingTop}
            />
            <AccountsList
                onSelectAccount={handleSelectAccount}
                searchValue={searchValue}
                networkFilter={filteredNetworks}
                isSendFlow={networkFilterType === 'send'}
                ListHeaderComponent={<>{children}</>}
                ListEmptyComponent={
                    <AccountsListEmptyPlaceholder isFilterEmpty={!searchValue.length} />
                }
                ListFooterComponent={
                    <AccountsListFooter
                        networkFilterType={networkFilterType}
                        activeFilterCount={filteredNetworks.length}
                        onClearFilters={() => setFilteredNetworks([])}
                    />
                }
            />
        </>
    );
};
