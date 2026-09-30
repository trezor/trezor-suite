import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSelector } from 'react-redux';

import { type BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { useNavigation } from '@react-navigation/native';

import { type NetworksRootState } from '@suite-common/networks';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AddCoinFlowType, type CloseActionType } from '@suite-native/navigation';

import {
    type NativeAccountsRootState,
    selectIsAccountsListNetworkFilterVisible,
} from '../selectors';
import { type OnSelectAccount } from '../types';
import { AccountsList } from './AccountsList/AccountsList';
import { AccountsListFooter } from './AccountsListFooter';
import { NetworkFilterBottomSheet } from './NetworkFilterBottomSheet';
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
    isSendFlow?: boolean;
    noHeaderPaddingTop?: boolean;
    onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
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
    isSendFlow,
    onScroll,
    noHeaderPaddingTop,
    children,
}: AccountsListWithFilterProps) => {
    const [searchValue, setSearchValue] = useState('');
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [filteredNetworks, setFilteredNetworks] = useState<NetworkSymbol[]>(networksFilter);
    const filterBottomSheetRef = useRef<BottomSheetModalMethods>(null);

    const isNetworkFilterVisible = useSelector(
        (state: NativeAccountsRootState & NetworksRootState) =>
            selectIsAccountsListNetworkFilterVisible(state, isSendFlow),
    );

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

    const handleFilterPress = () => {
        filterBottomSheetRef.current?.present();
    };

    const handleApplyFilter = (selected: NetworkSymbol[]) => {
        setFilteredNetworks(selected);
    };

    const handleClearFilters = () => {
        setFilteredNetworks([]);
    };

    return (
        <>
            <AccountsList
                onSelectAccount={handleSelectAccount}
                searchValue={searchValue}
                networkFilter={filteredNetworks}
                isSendFlow={isSendFlow}
                ListHeaderComponent={
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
                            onFilterPress={isNetworkFilterVisible ? handleFilterPress : undefined}
                            activeFilterCount={filteredNetworks.length}
                            noPaddingTop={noHeaderPaddingTop}
                        />
                        {children}
                    </>
                }
                ListFooterComponent={
                    <AccountsListFooter
                        isSendFlow={isSendFlow}
                        activeFilterCount={filteredNetworks.length}
                        onClearFilters={handleClearFilters}
                    />
                }
                onScroll={onScroll}
            />
            <NetworkFilterBottomSheet
                ref={filterBottomSheetRef}
                selectedNetworks={filteredNetworks}
                onApply={handleApplyFilter}
                onClear={handleClearFilters}
                isSendFlow={isSendFlow ?? false}
            />
        </>
    );
};
