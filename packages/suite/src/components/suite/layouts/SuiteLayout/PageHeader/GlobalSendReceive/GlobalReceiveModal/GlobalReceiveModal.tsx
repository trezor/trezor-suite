import { useCallback, useMemo, useState } from 'react';

import { type CryptoId } from 'invity-api';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { selectIsDebugModeActive } from '@suite/debug';
import { useDevice } from '@suite/device';
import { useServices } from '@suite-common/dependency-injection';
import { type TradingAssetOption } from '@suite-common/trading';
import { selectAccounts, selectEnabledNetworks } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { filterReceiveAccounts } from '@suite-common/wallet-utils';
import { exhaustive } from '@trezor/type-utils';

import { useModal } from 'src/components/suite/asset-picker/hooks/useModal';
import { AddAccountModal } from 'src/components/suite/modals/ReduxModal/UserContextModal/AddAccountModal/AddAccountModal';
import { useDiscovery, useSelector } from 'src/hooks/suite';
import { globalSendReceiveFiltersSelectors } from 'src/slices/wallet/globalSendReceiveFilters';

import {
    buildGlobalReceiveAssetSearchIndex,
    getGlobalReceiveAssetSections,
} from './globalReceiveAssetUtils';
import { useAccountsOptions } from './hooks/useAccountsOptions';
import { useFilterAccounts } from './hooks/useFilterAccounts';
import { useGlobalReceiveAssets } from './hooks/useGlobalReceiveAssets';
import { useGlobalReceiveNetworkSetup } from './hooks/useGlobalReceiveNetworkSetup';
import { GlobalReceiveAccountStep } from './steps/GlobalReceiveAccountStep';
import { GlobalReceiveNetworkSetupStep } from './steps/GlobalReceiveNetworkSetupStep';
import { GlobalReceiveSearchStep } from './steps/GlobalReceiveSearchStep';
import { type GlobalReceiveStep, type GlobalReceiveTab } from './types';

type GlobalReceiveModalProps = {
    onCancel: (filledSearch: boolean) => void;
    onSubmit: (account: Account, filledSearch: boolean) => void;
};

export const GlobalReceiveModal = ({ onCancel, onSubmit }: GlobalReceiveModalProps) => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const { device } = useDevice();
    const { isDiscoveryRunning } = useDiscovery();
    const accountModal = useModal();
    const [activeTab, setActiveTab] = useState<GlobalReceiveTab>('assets');
    const [receiveStep, setReceiveStep] = useState<GlobalReceiveStep>('search');
    const [selectedAssetCryptoId, setSelectedAssetCryptoId] = useState<CryptoId>();

    const accounts = useSelector(selectAccounts);
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const isDebug = useSelector(selectIsDebugModeActive);
    const search = useSelector(globalSendReceiveFiltersSelectors.selectSearch);
    const selectedNetworkSymbol = useSelector(
        globalSendReceiveFiltersSelectors.selectNetworkSymbol,
    );
    const filledSearch = useSelector(globalSendReceiveFiltersSelectors.filledSearch);

    const accountsOptions = useAccountsOptions();
    const filteredAccountOptions = useFilterAccounts(accountsOptions);
    const { assets, balances, networks, catalogStatus, retry } = useGlobalReceiveAssets();
    const assetSearchIndex = useMemo(() => buildGlobalReceiveAssetSearchIndex(assets), [assets]);

    const selectedAsset = useMemo(
        () => assets.find(asset => asset.id === selectedAssetCryptoId),
        [assets, selectedAssetCryptoId],
    );
    const staticSessionId = device?.state?.staticSessionId;
    const selectedAssetAccounts = useMemo(() => {
        if (!selectedAsset || !staticSessionId) {
            return [];
        }

        return filterReceiveAccounts({
            accounts,
            deviceState: staticSessionId,
            symbol: selectedAsset.networkSymbol,
            isDebug,
        });
    }, [accounts, isDebug, selectedAsset, staticSessionId]);
    const assetSections = useMemo(
        () =>
            getGlobalReceiveAssetSections({
                assets,
                balances,
                search,
                searchIndex: assetSearchIndex,
                networkSymbol: selectedNetworkSymbol,
            }),
        [assetSearchIndex, assets, balances, search, selectedNetworkSymbol],
    );

    const submitSelection = useCallback(
        (account: Account) => {
            onSubmit(account, filledSearch);
        },
        [filledSearch, onSubmit],
    );

    const handleAccountSelectionRequired = useCallback(() => setReceiveStep('account'), []);
    const handleSetupFailure = useCallback(() => setReceiveStep('search'), []);
    const isNetworkSetupAvailable =
        !!device?.connected &&
        !!device.available &&
        !!device.path &&
        !!staticSessionId &&
        !isDiscoveryRunning;

    useGlobalReceiveNetworkSetup({
        devicePath: device?.path,
        isDiscoveryRunning,
        receiveStep,
        selectedAsset,
        selectedAssetAccounts,
        staticSessionId,
        onAccountSelectionRequired: handleAccountSelectionRequired,
        onSetupFailure: handleSetupFailure,
        submitSelection,
    });

    const continueWithAsset = useCallback(
        (asset: TradingAssetOption) => {
            const eligibleAccounts = filterReceiveAccounts({
                accounts,
                deviceState: staticSessionId,
                symbol: asset.networkSymbol,
                isDebug,
            });
            const [onlyAccount] = eligibleAccounts;
            const isNetworkEnabled = enabledNetworks.includes(asset.networkSymbol);
            const isNetworkSetupRequired = !isNetworkEnabled || eligibleAccounts.length === 0;

            if (isNetworkSetupRequired && !isNetworkSetupAvailable) {
                return;
            }

            setSelectedAssetCryptoId(asset.id);

            if (isNetworkSetupRequired) {
                setReceiveStep('network-setup');

                return;
            }

            if (eligibleAccounts.length === 1 && onlyAccount) {
                submitSelection(onlyAccount);

                return;
            }

            setReceiveStep('account');
        },
        [
            accounts,
            enabledNetworks,
            isDebug,
            isNetworkSetupAvailable,
            staticSessionId,
            submitSelection,
        ],
    );

    const isAssetDisabled = useCallback(
        (asset: TradingAssetOption) => {
            if (isNetworkSetupAvailable) {
                return false;
            }

            const eligibleAccounts = filterReceiveAccounts({
                accounts,
                deviceState: staticSessionId,
                symbol: asset.networkSymbol,
                isDebug,
            });

            return !enabledNetworks.includes(asset.networkSymbol) || eligibleAccounts.length === 0;
        },
        [accounts, enabledNetworks, isDebug, isNetworkSetupAvailable, staticSessionId],
    );

    const handleTabChange = (tab: GlobalReceiveTab) => {
        setActiveTab(tab);
    };

    const handleBack = () => {
        setReceiveStep('search');
    };

    const handleAccountTabSelection = (account: Account) => {
        onSubmit(account, filledSearch);
    };

    const handleAddAccount = () => {
        if (!device) {
            return;
        }

        accountModal.openModal();
        analytics.report({
            type: events.dashboardReceiveModalOptionsEvent.name,
            payload: {
                option: 'addAccount',
                filledSearch,
            },
        });
    };

    const handleCancel = () => onCancel(filledSearch);
    const isAddAccountDisabled = isDiscoveryRunning || !device?.connected || !device?.available;

    const renderReceiveModal = () => {
        switch (receiveStep) {
            case 'search':
                return (
                    <GlobalReceiveSearchStep
                        activeTab={activeTab}
                        accountNetworks={enabledNetworks}
                        assetNetworks={networks}
                        assetSections={assetSections}
                        catalogStatus={catalogStatus}
                        filledSearch={filledSearch}
                        filteredAccountOptions={filteredAccountOptions}
                        isAddAccountDisabled={isAddAccountDisabled}
                        isAssetDisabled={isAssetDisabled}
                        onAccountClick={handleAccountTabSelection}
                        onAddAccountClick={handleAddAccount}
                        onAssetClick={continueWithAsset}
                        onCancel={handleCancel}
                        onRetry={retry}
                        onTabChange={handleTabChange}
                    />
                );
            case 'account':
                return (
                    <GlobalReceiveAccountStep
                        accounts={selectedAssetAccounts}
                        asset={selectedAsset}
                        onAccountClick={submitSelection}
                        onBack={handleBack}
                        onCancel={handleCancel}
                    />
                );
            case 'network-setup':
                return (
                    <GlobalReceiveNetworkSetupStep
                        asset={selectedAsset}
                        onBack={handleBack}
                        onCancel={handleCancel}
                    />
                );
            default:
                return exhaustive(receiveStep);
        }
    };

    if (accountModal.open && device) {
        return (
            <AddAccountModal
                device={device}
                onBack={accountModal.closeModal}
                onCancel={accountModal.closeModal}
            />
        );
    }

    return renderReceiveModal();
};
