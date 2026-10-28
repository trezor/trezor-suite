import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { selectIsDebugModeActive } from '@suite/debug';
import { useDevice } from '@suite/device';
import { selectHasBitcoinOnlyFirmware } from '@suite-common/device';
import { selectSupportedNetworkSymbols } from '@suite-common/networks';
import { useGlobalReceiveAssets } from '@suite-common/receive';
import { type TradingAssetOption } from '@suite-common/trading';
import { selectAccounts, selectEnabledNetworks } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { filterReceiveAccounts } from '@suite-common/wallet-utils';
import { useServices } from '@trezor/dependency-injection';
import { exhaustive } from '@trezor/type-utils';

import { useModal } from 'src/components/suite/asset-picker/hooks/useModal';
import { AddAccountModal } from 'src/components/suite/modals/ReduxModal/UserContextModal/AddAccountModal/AddAccountModal';
import { useDiscovery } from 'src/hooks/suite';
import { globalSendReceiveFiltersSelectors } from 'src/slices/wallet/globalSendReceiveFilters';

import { GlobalReceiveAccountStep } from './steps/GlobalReceiveAccountStep';
import { GlobalReceiveNetworkSetupStep } from './steps/GlobalReceiveNetworkSetupStep';
import { GlobalReceiveSearchStep } from './steps/GlobalReceiveSearchStep';
import { type GlobalReceiveStep, type GlobalReceiveTab } from './types';

type IsNetworkSetupRequiredParams = {
    isNetworkEnabled: boolean;
    eligibleAccountCount: number;
};

const isNetworkSetupRequired = ({
    isNetworkEnabled,
    eligibleAccountCount,
}: IsNetworkSetupRequiredParams) => !isNetworkEnabled || eligibleAccountCount === 0;

type GlobalReceiveModalProps = {
    initialAsset?: TradingAssetOption;
    onCancel: (filledSearch: boolean) => void;
    onSubmit: (account: Account, filledSearch: boolean) => void;
};

export const GlobalReceiveModal = ({
    initialAsset,
    onCancel,
    onSubmit,
}: GlobalReceiveModalProps) => {
    const isBitcoinOnlyFirmware = useSelector(selectHasBitcoinOnlyFirmware);
    const accounts = useSelector(selectAccounts);
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const supportedNetworks = useSelector(selectSupportedNetworkSymbols);
    const isDebug = useSelector(selectIsDebugModeActive);
    const filledSearch = useSelector(globalSendReceiveFiltersSelectors.filledSearch);
    const search = useSelector(globalSendReceiveFiltersSelectors.selectSearch);
    const networkSymbol = useSelector(globalSendReceiveFiltersSelectors.selectNetworkSymbol);

    const { analytics } = useServices(injectDesktopAnalytics);
    const { device } = useDevice();
    const { isDiscoveryRunning } = useDiscovery();
    const accountModal = useModal();

    const staticSessionId = device?.state?.staticSessionId;
    const isNetworkSetupAvailable =
        !!device?.connected &&
        !!device.available &&
        !!device.path &&
        !!staticSessionId &&
        !isDiscoveryRunning;
    const hasSearchStep = initialAsset === undefined;

    const [activeTab, setActiveTab] = useState<GlobalReceiveTab>(
        isBitcoinOnlyFirmware ? 'accounts' : 'assets',
    );
    const [selectedAsset, setSelectedAsset] = useState(initialAsset);
    const [wasSelectedAssetNetworkInactive, setWasSelectedAssetNetworkInactive] = useState(
        initialAsset !== undefined && !enabledNetworks.includes(initialAsset.networkSymbol),
    );
    const selectedAssetAccounts = useMemo(() => {
        if (!selectedAsset || !staticSessionId) {
            return [];
        }

        return filterReceiveAccounts({
            accounts,
            supportedNetworks,
            deviceState: staticSessionId,
            symbol: selectedAsset.networkSymbol,
            isDebug,
        });
    }, [accounts, isDebug, selectedAsset, staticSessionId, supportedNetworks]);
    const [receiveStep, setReceiveStep] = useState<GlobalReceiveStep>(() => {
        if (initialAsset === undefined) {
            return 'search';
        }

        const isSetupRequired = isNetworkSetupRequired({
            isNetworkEnabled: enabledNetworks.includes(initialAsset.networkSymbol),
            eligibleAccountCount: selectedAssetAccounts.length,
        });

        return isSetupRequired && isNetworkSetupAvailable ? 'network-setup' : 'account';
    });

    const { myAssets, otherAssets, networks, catalogStatus, retry } = useGlobalReceiveAssets({
        search,
        networkSymbols: networkSymbol ? [networkSymbol] : [],
    });

    const submitSelection = useCallback(
        (account: Account) => {
            onSubmit(account, filledSearch);
        },
        [filledSearch, onSubmit],
    );

    const handleAccountSelectionRequired = useCallback(() => setReceiveStep('account'), []);

    const continueWithAsset = useCallback(
        (asset: TradingAssetOption) => {
            const eligibleAccounts = filterReceiveAccounts({
                accounts,
                supportedNetworks,
                deviceState: staticSessionId,
                symbol: asset.networkSymbol,
                isDebug,
            });
            const [onlyAccount] = eligibleAccounts;
            const isNetworkEnabled = enabledNetworks.includes(asset.networkSymbol);
            const isSetupRequired = isNetworkSetupRequired({
                isNetworkEnabled,
                eligibleAccountCount: eligibleAccounts.length,
            });

            if (isSetupRequired && !isNetworkSetupAvailable) {
                return;
            }

            setSelectedAsset(asset);
            setWasSelectedAssetNetworkInactive(!isNetworkEnabled);

            if (isSetupRequired) {
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
            supportedNetworks,
        ],
    );

    const isAssetDisabled = useCallback(
        (asset: TradingAssetOption) => {
            if (isNetworkSetupAvailable) {
                return false;
            }

            const eligibleAccounts = filterReceiveAccounts({
                accounts,
                supportedNetworks,
                deviceState: staticSessionId,
                symbol: asset.networkSymbol,
                isDebug,
            });

            return isNetworkSetupRequired({
                isNetworkEnabled: enabledNetworks.includes(asset.networkSymbol),
                eligibleAccountCount: eligibleAccounts.length,
            });
        },
        [
            accounts,
            enabledNetworks,
            isDebug,
            isNetworkSetupAvailable,
            staticSessionId,
            supportedNetworks,
        ],
    );

    const handleTabChange = (tab: GlobalReceiveTab) => {
        setActiveTab(tab);
    };

    const handleBack = useCallback(() => {
        setSelectedAsset(undefined);
        setReceiveStep('search');
    }, []);

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

    const renderReceiveModal = () => {
        switch (receiveStep) {
            case 'search':
                return (
                    <GlobalReceiveSearchStep
                        activeTab={activeTab}
                        accountNetworks={enabledNetworks}
                        myAssets={myAssets}
                        otherAssets={otherAssets}
                        assetNetworks={networks}
                        catalogStatus={catalogStatus}
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
                        onBack={hasSearchStep ? handleBack : undefined}
                        onCancel={handleCancel}
                    />
                );
            case 'network-setup':
                return (
                    <GlobalReceiveNetworkSetupStep
                        asset={selectedAsset}
                        assetAccounts={selectedAssetAccounts}
                        wasAssetNetworkInactive={wasSelectedAssetNetworkInactive}
                        onAccountSelectionRequired={handleAccountSelectionRequired}
                        onBack={hasSearchStep ? handleBack : undefined}
                        onCancel={handleCancel}
                        onSetupFailure={hasSearchStep ? handleBack : handleCancel}
                        onSubmit={submitSelection}
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
