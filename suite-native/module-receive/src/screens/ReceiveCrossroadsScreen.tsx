import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { events as commonEvents } from '@suite-common/analytics';
import { selectHasBitcoinOnlyFirmware } from '@suite-common/device';
import { type GlobalReceiveAssetListItem } from '@suite-common/receive';
import {
    AccountsList,
    AccountsListFooter,
    AddAccountButton,
    type NetworkFilter,
    NetworkFilterButton,
} from '@suite-native/accounts';
import { injectNativeAnalytics, events as nativeEvents } from '@suite-native/analytics';
import {
    Box,
    HStack,
    SearchInput,
    type SubTabItem,
    SubTabs,
    TextButton,
    VStack,
} from '@suite-native/atoms';
import { selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice } from '@suite-native/device';
import { Translation, useTranslate } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';
import type { NetworkSymbol } from '@trezor/network-module-types';
import { useDebounce } from '@trezor/react-utils';
import { injectDispatch } from '@trezor/redux-utils';

import { ReceiveBlockedDeviceCompromisedScreen } from './ReceiveBlockedDeviceCompromisedScreen';
import { AssetList } from '../components/AssetList';
import { NoResultsPlaceholder } from '../components/NoResultsPlaceholder';
import { useReceiveAssetListItems } from '../hooks/useReceiveAssetListItems';
import { useReceiveNavigation } from '../hooks/useReceiveNavigation';

type Tab = 'assets' | 'accounts';

export const ReceiveCrossroadsScreen = () => {
    const { analytics } = useServices(injectDispatch, injectNativeAnalytics);
    const { navigateToReceiveScreen, navigateToReceiveAddressScreen } = useReceiveNavigation();
    const { translate } = useTranslate();
    const debounce = useDebounce();

    const hasFirmwareAuthenticityCheckHardFailed = useSelector(
        selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice,
    );
    const hasBitcoinOnlyFirmware = useSelector(selectHasBitcoinOnlyFirmware);

    const [searchValue, setSearchValue] = useState('');
    const [filteredNetworks, setFilteredNetworks] = useState<NetworkSymbol[]>([]);
    const [activeTab, setActiveTab] = useState<Tab>(hasBitcoinOnlyFirmware ? 'accounts' : 'assets');

    const tabs: SubTabItem<Tab>[] = useMemo(
        () => [
            { value: 'assets', label: <Translation id="moduleReceive.tabs.assets" /> },
            { value: 'accounts', label: <Translation id="moduleReceive.tabs.accounts" /> },
        ],
        [],
    );

    const { items, loadMoreOtherAssets, resetOtherAssetsLimit } = useReceiveAssetListItems({
        searchValue,
        filteredNetworks,
    });

    const handleSearchChange = (value: string) => {
        debounce(() => {
            resetOtherAssetsLimit();
            setSearchValue(value);
        });
    };

    const reportNetworkFilterOpen = () => {
        analytics.report({
            type: commonEvents.receiveEntryInteractionEvent.name,
            payload: { action: 'network-filter-open' },
        });
    };

    const setFilteredNetworksWithAnalytics = (networkSymbols: NetworkSymbol[]) => {
        setFilteredNetworks(networkSymbols);
        analytics.report({
            type: commonEvents.receiveEntryInteractionEvent.name,
            payload: {
                action: networkSymbols.length ? 'network-filter-select' : 'network-filter-clear',
                networkSymbols: networkSymbols.length ? networkSymbols : undefined,
            },
        });
    };

    const setActiveTabWithAnalytics = (tab: Tab) => {
        setActiveTab(tab);
        analytics.report({
            type: commonEvents.receiveEntryInteractionEvent.name,
            payload: { action: tab === 'assets' ? 'assets-tab' : 'accounts-tab' },
        });
    };

    const handleAssetSelect = useCallback(
        ({ asset }: GlobalReceiveAssetListItem) => navigateToReceiveScreen(asset),
        [navigateToReceiveScreen],
    );

    const viewAccounts = () => {
        setActiveTab('accounts');
        analytics.report({
            type: commonEvents.receiveEntryInteractionEvent.name,
            payload: { action: 'view-accounts' },
        });
    };

    const handleAddAccount = () => {
        analytics.report({
            type: nativeEvents.receiveOptionsScreenEvent.name,
            payload: { option: 'addAccount' },
        });
    };

    const networkFilter: NetworkFilter = {
        type: 'all',
        filteredNetworks,
        setFilteredNetworks: setFilteredNetworksWithAnalytics,
    };

    if (hasFirmwareAuthenticityCheckHardFailed) {
        return <ReceiveBlockedDeviceCompromisedScreen />;
    }

    return (
        <Screen
            header={
                <ScreenHeader
                    title={<Translation id="moduleReceive.receiveTitle" />}
                    closeActionType="close"
                    rightIcon={
                        activeTab === 'accounts' && (
                            <AddAccountButton flowType="receive" onPress={handleAddAccount} />
                        )
                    }
                />
            }
            isScrollable={false}
            noHorizontalPadding
            noBottomPadding
            hasBottomInset={false}
        >
            <VStack marginHorizontal="sp16" marginBottom="sp16" spacing="sp12">
                <HStack spacing="sp12">
                    <Box flex={1}>
                        <SearchInput
                            placeholder={translate('moduleReceive.search.placeholder')}
                            onChange={handleSearchChange}
                            maxLength={30}
                        />
                    </Box>
                    <NetworkFilterButton filter={networkFilter} onPress={reportNetworkFilterOpen} />
                </HStack>
                {!hasBitcoinOnlyFirmware && (
                    <SubTabs items={tabs} onChange={setActiveTabWithAnalytics} value={activeTab} />
                )}
            </VStack>
            {activeTab === 'assets' && (
                <AssetList
                    items={items}
                    onSelect={handleAssetSelect}
                    ListEmptyComponent={
                        <NoResultsPlaceholder
                            subtitle={<Translation id="moduleReceive.search.noAssets" />}
                        >
                            <TextButton isUnderlined onPress={viewAccounts}>
                                <Translation id="moduleReceive.search.viewAccounts" />
                            </TextButton>
                        </NoResultsPlaceholder>
                    }
                    onEndReached={loadMoreOtherAssets}
                />
            )}
            {activeTab === 'accounts' && (
                <AccountsList
                    searchValue={searchValue}
                    networkFilter={filteredNetworks}
                    onSelectAccount={navigateToReceiveAddressScreen}
                    ListEmptyComponent={
                        <NoResultsPlaceholder
                            subtitle={<Translation id="moduleReceive.search.noAccounts" />}
                        />
                    }
                    ListFooterComponent={
                        <AccountsListFooter
                            networkFilterType={networkFilter.type}
                            activeFilterCount={filteredNetworks.length}
                            onClearFilters={() => setFilteredNetworksWithAnalytics([])}
                        />
                    }
                />
            )}
        </Screen>
    );
};
