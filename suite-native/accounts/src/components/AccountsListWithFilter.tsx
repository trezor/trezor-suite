import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { type BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { useNavigation } from '@react-navigation/native';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Box, Button, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { type AddCoinFlowType, type CloseActionType } from '@suite-native/navigation';

import { AccountsList } from './AccountsList/AccountsList';
import { NetworkFilterBottomSheet } from './NetworkFilterBottomSheet';
import { SearchableAccountsListHeader } from './SearchableAccountsListHeader';
import { type NativeAccountsRootState, selectNetworkFilterOptions } from '../selectors';
import { type OnSelectAccount } from '../types';

const EMPTY_NETWORKS_FILTER: NetworkSymbol[] = [];

type AccountsListWithFilterProps = {
    onSelectAccount: OnSelectAccount;
    title: ReactNode;
    flowType?: AddCoinFlowType;
    networksFilter?: NetworkSymbol[];
    closeActionType?: CloseActionType;
    closeAction?: () => void;
    isSendFlow?: boolean;
    children?: ReactNode;
};

export const AccountsListWithFilter = ({
    onSelectAccount,
    title,
    flowType,
    networksFilter = EMPTY_NETWORKS_FILTER,
    closeActionType,
    closeAction,
    isSendFlow,
    children,
}: AccountsListWithFilterProps) => {
    const [searchValue, setSearchValue] = useState('');
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [filteredNetworks, setFilteredNetworks] = useState<NetworkSymbol[]>(networksFilter);
    const filterBottomSheetRef = useRef<BottomSheetModalMethods>(null);

    const networkFilterOptions = useSelector((state: NativeAccountsRootState) =>
        selectNetworkFilterOptions(state, isSendFlow),
    );
    const isNetworkFilterVisible = networkFilterOptions.length > 1;

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
            <SearchableAccountsListHeader
                title={title}
                onSearchInputChange={setSearchValue}
                isSearchActive={isSearchActive}
                onSearchActiveChange={setIsSearchActive}
                flowType={flowType}
                closeActionType={closeActionType}
                closeAction={closeAction}
                onFilterPress={isNetworkFilterVisible ? handleFilterPress : undefined}
                activeFilterCount={filteredNetworks.length}
            />
            {children}
            <VStack spacing="sp16">
                <AccountsList
                    onSelectAccount={handleSelectAccount}
                    searchValue={searchValue}
                    networkFilter={filteredNetworks}
                    isSendFlow={isSendFlow}
                />
                {isNetworkFilterVisible && filteredNetworks.length > 0 && (
                    <Box alignItems="center">
                        <Button
                            size="medium"
                            intent="neutral"
                            priority="secondary"
                            onPress={handleClearFilters}
                        >
                            <Translation id="moduleAccountManagement.accountsScreen.networkFilter.showAllButton" />
                        </Button>
                    </Box>
                )}
            </VStack>
            <NetworkFilterBottomSheet
                ref={filterBottomSheetRef}
                options={networkFilterOptions}
                selectedNetworks={filteredNetworks}
                onApply={handleApplyFilter}
                onClear={handleClearFilters}
            />
        </>
    );
};
