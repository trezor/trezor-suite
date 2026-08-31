import { useRef } from 'react';

import { injectDesktopAnalytics } from '@suite/analytics';
import { Translation } from '@suite/intl';
import {
    type ReceiveEntryInteractionAction,
    events as sharedEvents,
} from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { type TradeableAssetBalances, type TradingAssetOption } from '@suite-common/trading';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { Column, Link, SubTabs } from '@trezor/components';
import { HOW_TO_CHOOSE_RIGHT_NETWORK_URL } from '@trezor/urls';

import { AssetsModal } from 'src/components/suite/asset-picker/components';
import { globalSendReceiveFiltersActions } from 'src/slices/wallet/globalSendReceiveFilters';

import { AssetSearchWithNetworkFilter } from '../../AssetSearchWithNetworkFilter/AssetSearchWithNetworkFilter';
import { GLOBAL_RECEIVE_MODAL_HEIGHT } from '../constants';
import { type GlobalReceiveAssetCatalogStatus } from '../hooks/useGlobalReceiveAssets';
import { type GlobalReceiveTab } from '../types';
import { GlobalReceiveAccountsTab } from './GlobalReceiveAccountsTab';
import { GlobalReceiveAssetsTab } from './GlobalReceiveAssetsTab';

type GlobalReceiveSearchStepProps = {
    activeTab: GlobalReceiveTab;
    assets: TradingAssetOption[];
    assetNetworks: readonly NetworkSymbol[];
    accountNetworks: readonly NetworkSymbol[];
    balances: TradeableAssetBalances;
    catalogStatus: GlobalReceiveAssetCatalogStatus;
    isAssetDisabled: (asset: TradingAssetOption) => boolean;
    onAccountClick: (account: Account) => void;
    onAddAccountClick: () => void;
    onAssetClick: (asset: TradingAssetOption) => void;
    onCancel: () => void;
    onRetry: () => void;
    onTabChange: (tab: GlobalReceiveTab) => void;
};

export const GlobalReceiveSearchStep = ({
    activeTab,
    assets,
    assetNetworks,
    accountNetworks,
    balances,
    catalogStatus,
    isAssetDisabled,
    onAccountClick,
    onAddAccountClick,
    onAssetClick,
    onCancel,
    onRetry,
    onTabChange,
}: GlobalReceiveSearchStepProps) => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const listRef = useRef<HTMLDivElement>(null);

    const reportEntryInteraction = (
        action: ReceiveEntryInteractionAction,
        networkSymbol?: NetworkSymbol,
    ) => {
        analytics.report({
            type: sharedEvents.receiveEntryInteractionEvent.name,
            payload: {
                action,
                platform: 'desktop',
                ...(networkSymbol ? { networkSymbol } : {}),
            },
        });
    };

    const handleTabChange = (tab: GlobalReceiveTab) => {
        if (tab === activeTab) {
            return;
        }

        reportEntryInteraction(tab === 'assets' ? 'assets-tab' : 'accounts-tab');
        onTabChange(tab);
    };

    const handleNetworkFilterChange = (networkSymbol: NetworkSymbol | undefined) => {
        if (networkSymbol) {
            reportEntryInteraction('network-filter-select', networkSymbol);

            return;
        }

        reportEntryInteraction('network-filter-clear');
    };

    const handleViewAccountsClick = () => {
        dispatch(globalSendReceiveFiltersActions.setSearch(''));
        reportEntryInteraction('view-accounts');
        onTabChange('accounts');
    };

    return (
        <AssetsModal
            heading={<Translation id="TR_RECEIVE" />}
            description={
                <Translation
                    id="TR_GLOBAL_RECEIVE_DESCRIPTION"
                    values={{
                        a: (...chunks) => (
                            <Link
                                href={HOW_TO_CHOOSE_RIGHT_NETWORK_URL}
                                onClick={() => reportEntryInteraction('right-network-link')}
                            >
                                {chunks}
                            </Link>
                        ),
                    }}
                />
            }
            onClose={onCancel}
            height={GLOBAL_RECEIVE_MODAL_HEIGHT}
            data-testid="@global-receive/modal"
        >
            <Column gap={8}>
                <Column gap={16} padding={{ horizontal: 16 }}>
                    <AssetSearchWithNetworkFilter
                        placeholder={
                            activeTab === 'assets'
                                ? 'TR_GLOBAL_RECEIVE_SEARCH_ASSETS'
                                : 'TR_RECEIVE_SEARCH'
                        }
                        listRef={listRef}
                        modal="receive"
                        networks={activeTab === 'assets' ? assetNetworks : accountNetworks}
                        onNetworkFilterChange={handleNetworkFilterChange}
                        onNetworkFilterOpen={() => reportEntryInteraction('network-filter-open')}
                        shouldResetSearchOnNetworkChange={false}
                    />
                    <SubTabs activeItemId={activeTab}>
                        <SubTabs.Item
                            id="assets"
                            data-testid="@global-receive/tab/assets"
                            onClick={() => handleTabChange('assets')}
                        >
                            <Translation id="TR_GLOBAL_RECEIVE_ASSETS_TAB" />
                        </SubTabs.Item>
                        <SubTabs.Item
                            id="accounts"
                            data-testid="@global-receive/tab/accounts"
                            onClick={() => handleTabChange('accounts')}
                        >
                            <Translation id="TR_GLOBAL_RECEIVE_ACCOUNTS_TAB" />
                        </SubTabs.Item>
                    </SubTabs>
                </Column>

                {activeTab === 'assets' ? (
                    <GlobalReceiveAssetsTab
                        assets={assets}
                        balances={balances}
                        catalogStatus={catalogStatus}
                        isAssetDisabled={isAssetDisabled}
                        listRef={listRef}
                        onAssetClick={onAssetClick}
                        onRetry={onRetry}
                        onViewAccountsClick={handleViewAccountsClick}
                    />
                ) : (
                    <GlobalReceiveAccountsTab
                        onAccountClick={onAccountClick}
                        onAddAccountClick={onAddAccountClick}
                    />
                )}
            </Column>
        </AssetsModal>
    );
};
