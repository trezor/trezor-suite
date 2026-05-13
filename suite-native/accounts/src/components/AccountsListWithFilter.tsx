import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { type BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

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
    hideTokensIntoModal?: boolean;
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
    hideTokensIntoModal,
    isSendFlow,
    children,
}: AccountsListWithFilterProps) => {
    const [searchValue, setSearchValue] = useState('');
    const [filteredNetworks, setFilteredNetworks] = useState<NetworkSymbol[]>(networksFilter);
    const filterBottomSheetRef = useRef<BottomSheetModalMethods>(null);

    const networkFilterOptions = useSelector((state: NativeAccountsRootState) =>
        selectNetworkFilterOptions(state, isSendFlow),
    );

    useEffect(() => {
        setFilteredNetworks(networksFilter);
    }, [networksFilter]);

    const handleFilterPress = () => {
        filterBottomSheetRef.current?.present();
    };

    const handleApplyFilter = (selected: NetworkSymbol[]) => {
        setFilteredNetworks(selected);
    };

    const handleClearFilters = () => {
        setFilteredNetworks([]);
        setSearchValue('');
    };

    return (
        <>
            <SearchableAccountsListHeader
                title={title}
                onSearchInputChange={setSearchValue}
                searchValue={searchValue}
                flowType={flowType}
                closeActionType={closeActionType}
                closeAction={closeAction}
                onFilterPress={handleFilterPress}
                activeFilterCount={filteredNetworks.length}
            />
            {children}
            <VStack spacing="sp16">
                <AccountsList
                    onSelectAccount={onSelectAccount}
                    searchValue={searchValue}
                    networkFilter={filteredNetworks}
                    hideTokensIntoModal={hideTokensIntoModal}
                    isSendFlow={isSendFlow}
                />
                {(filteredNetworks.length > 0 || searchValue.length > 0) && (
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
