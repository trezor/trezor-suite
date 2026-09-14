import { useRef } from 'react';

import { useDevice } from '@suite/device';
import { Translation, type TranslationKey } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';
import { type TradingAssetOption } from '@suite-common/trading';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { Column, Link, SubTabs } from '@trezor/components';
import { HOW_TO_CHOOSE_RIGHT_NETWORK_URL } from '@trezor/urls';

import { AssetsModal } from 'src/components/suite/asset-picker/components';
import { useDiscovery } from 'src/hooks/suite';
import { globalSendReceiveFiltersActions } from 'src/slices/wallet/globalSendReceiveFilters';

import { AssetSearchWithNetworkFilter } from '../../AssetSearchWithNetworkFilter/AssetSearchWithNetworkFilter';
import { GLOBAL_RECEIVE_MODAL_HEIGHT } from '../constants';
import { type GlobalReceiveAssetSections } from '../globalReceiveAssetUtils';
import { type AccountOption } from '../hooks/useAccountsOptions';
import { type GlobalReceiveAssetCatalogStatus } from '../hooks/useGlobalReceiveAssets';
import { type GlobalReceiveTab } from '../types';
import { GlobalReceiveAccountsTab } from './GlobalReceiveAccountsTab';
import { GlobalReceiveAssetsTab } from './GlobalReceiveAssetsTab';

type GlobalReceiveSearchStepProps = {
    activeTab: GlobalReceiveTab;
    assetSections: GlobalReceiveAssetSections;
    assetNetworks: readonly NetworkSymbol[];
    accountNetworks: readonly NetworkSymbol[];
    catalogStatus: GlobalReceiveAssetCatalogStatus;
    filteredAccountOptions: AccountOption[];
    isAssetDisabled: (asset: TradingAssetOption) => boolean;
    onAccountClick: (account: Account) => void;
    onAddAccountClick: () => void;
    onAssetClick: (asset: TradingAssetOption) => void;
    onCancel: () => void;
    onRetry: () => void;
    onTabChange: (tab: GlobalReceiveTab) => void;
};

const getAssetDisabledMessage = (
    isDeviceConnected: boolean | undefined,
    isDiscoveryRunning: boolean,
): TranslationKey | undefined => {
    if (isDeviceConnected === false) {
        return 'TR_TO_ADD_NEW_ACCOUNT_PLEASE_CONNECT';
    }

    if (isDiscoveryRunning) {
        return 'TR_TO_ADD_NEW_ACCOUNT_WAIT_FOR_DISCOVERY';
    }
};

export const GlobalReceiveSearchStep = ({
    activeTab,
    assetSections,
    assetNetworks,
    accountNetworks,
    catalogStatus,
    filteredAccountOptions,
    isAssetDisabled,
    onAccountClick,
    onAddAccountClick,
    onAssetClick,
    onCancel,
    onRetry,
    onTabChange,
}: GlobalReceiveSearchStepProps) => {
    const { device } = useDevice();
    const { isDiscoveryRunning } = useDiscovery();
    const { dispatch } = useServices(selectDispatch);
    const listRef = useRef<HTMLDivElement>(null);
    const isAddAccountDisabled = isDiscoveryRunning || !device?.connected || !device?.available;
    const assetDisabledMessage = getAssetDisabledMessage(device?.connected, isDiscoveryRunning);
    const handleViewAccountsClick = () => {
        dispatch(globalSendReceiveFiltersActions.setSearch(''));
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
                            <Link href={HOW_TO_CHOOSE_RIGHT_NETWORK_URL}>{chunks}</Link>
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
                        shouldResetSearchOnNetworkChange={false}
                    />
                    <SubTabs activeItemId={activeTab}>
                        <SubTabs.Item
                            id="assets"
                            data-testid="@global-receive/tab/assets"
                            onClick={() => onTabChange('assets')}
                        >
                            <Translation id="TR_GLOBAL_RECEIVE_ASSETS_TAB" />
                        </SubTabs.Item>
                        <SubTabs.Item
                            id="accounts"
                            data-testid="@global-receive/tab/accounts"
                            onClick={() => onTabChange('accounts')}
                        >
                            <Translation id="TR_GLOBAL_RECEIVE_ACCOUNTS_TAB" />
                        </SubTabs.Item>
                    </SubTabs>
                </Column>

                {activeTab === 'assets' ? (
                    <GlobalReceiveAssetsTab
                        assetSections={assetSections}
                        catalogStatus={catalogStatus}
                        disabledMessage={assetDisabledMessage}
                        isAssetDisabled={isAssetDisabled}
                        listRef={listRef}
                        onAssetClick={onAssetClick}
                        onRetry={onRetry}
                        onViewAccountsClick={handleViewAccountsClick}
                    />
                ) : (
                    <GlobalReceiveAccountsTab
                        accountOptions={filteredAccountOptions}
                        isAddAccountDisabled={isAddAccountDisabled}
                        onAccountClick={onAccountClick}
                        onAddAccountClick={onAddAccountClick}
                    />
                )}
            </Column>
        </AssetsModal>
    );
};
