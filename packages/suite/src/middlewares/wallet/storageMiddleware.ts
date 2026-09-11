import { type UnknownAction, isAnyOf } from '@reduxjs/toolkit';

import {
    clientOnPrisonEvent,
    isCoinjoinAccountPersistenceAction,
    setDebugSettings,
} from '@suite/coinjoin';
import { debugActions } from '@suite/debug';
import { featureUsed, feedbackDismissed, feedbackRequested } from '@suite/feature-feedback';
import {
    type FlagsRootState,
    markNewContentIndicatorAsSeen,
    setFlag,
    setNewContentIndicatorSeen,
} from '@suite/flags';
import { metadataActions } from '@suite/metadata';
import { type SuiteSettingsRootState, suiteSettingsActions } from '@suite/settings';
import { dismissUnsupportedDeviceBanner } from '@suite/suite-sync';
import { analyticsActions } from '@suite-common/analytics-redux';
import { bluetoothActions } from '@suite-common/bluetooth';
import { connectPopupActions } from '@suite-common/connect-popup';
import {
    type DeviceRootState,
    deviceActions,
    selectDeviceByState,
    selectDeviceByStaticSessionId,
    selectDevices,
    selectSelectedDevice,
} from '@suite-common/device';
import { discreetModeActions } from '@suite-common/discreet-mode';
import { firmwareActions } from '@suite-common/firmware';
import { messageSystemActions } from '@suite-common/message-system';
import { receiveActions } from '@suite-common/receive';
import {
    type ActionFromMatcher,
    type Dispatch,
    type TypeGuard,
    type WithServices,
    createMiddlewareWithExtraDeps,
} from '@suite-common/redux-utils';
import {
    setSuiteSyncOwner,
    setSuiteSyncRelayUrl,
    updateSuiteSyncDebugEnabled,
    updateSuiteSyncEnabled,
} from '@suite-common/suite-sync';
import { suiteSyncQuotaManagerActions } from '@suite-common/suite-sync-quota-manager';
import { type TrezorDevice } from '@suite-common/suite-types';
import { getIsDeviceRemembered } from '@suite-common/suite-utils';
import { thpActions } from '@suite-common/thp';
import { TokenManagementAction } from '@suite-common/token-definitions';
import { tokenDefinitionsActions } from '@suite-common/token-definitions/src/tokenDefinitionsActions';
import { tradingActions } from '@suite-common/trading';
import {
    type AccountsRootState,
    type FiatRatesRootState,
    type WalletSettingsRootState,
    accountsActions,
    blockchainActions,
    changeNetworks,
    earnOnboardingActions,
    explorerActions,
    phishingActions,
    selectAccountByKey,
    selectAccountsByDeviceState,
    selectHistoricFiatRates,
    selectIsDeviceAutoEjectEnabled,
    setAddressDisplayType,
    setAutoEjectEnabled,
    setBaseCurrency,
    setBitcoinAmountUnits,
    setMevProtection,
    setNetworkReserve,
    setSuspiciousTransactionsFilter,
    transactionsActions,
    updateTxsFiatRatesThunk,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { findAccountDevice, isAccountSuccessful } from '@suite-common/wallet-utils';
import { walletConnectActions } from '@suite-common/walletconnect';
import { DEVICE, isDeviceEventOfType } from '@trezor/connect';

import * as storageActions from 'src/actions/suite/storageActions';
import {
    closeEvmExplanationBanner,
    confirmEvmExplanationModal,
} from 'src/actions/suite/suiteActions';
import { accountGraphFail, accountGraphSuccess } from 'src/actions/wallet/graphActions';
import { type SuiteState } from 'src/reducers/suite/suiteReducer';
import { selectGraph } from 'src/reducers/wallet/graphReducer';
import { type GraphState } from 'src/reducers/wallet/graphReducer';
import { type DbDep } from 'src/storage/createDb';

type StorageMiddlewareDeps = WithServices<DbDep>;

type StorageMiddlewareState = AccountsRootState &
    DeviceRootState &
    FiatRatesRootState &
    WalletSettingsRootState &
    FlagsRootState &
    SuiteSettingsRootState & {
        suite: Pick<SuiteState, 'evmSettings' | 'seenDisconnectNotificationForDeviceIds'>;
        wallet: {
            graph: GraphState;
        };
    };

const getDeviceByAccountKey = (accountKey: AccountKey, state: StorageMiddlewareState) => {
    const account = selectAccountByKey(state, accountKey);

    return account ? findAccountDevice(account, selectDevices(state)) : undefined;
};

type RememberedDeviceSaveParams<TAction> = {
    action: TAction;
    device: TrezorDevice;
};

type RememberedDeviceSaveDeps = DbDep & {
    dispatch: Dispatch;
    getState: () => StorageMiddlewareState;
};

type RememberedDeviceHandler = {
    match: ReadonlyArray<(action: UnknownAction) => boolean>;
    getDevice: (action: any, state: StorageMiddlewareState) => TrezorDevice | undefined;
    save: (params: RememberedDeviceSaveParams<any>, deps: RememberedDeviceSaveDeps) => void;
};

const defineRememberedDeviceHandler = <Matchers extends ReadonlyArray<TypeGuard<any>>>(handler: {
    match: readonly [...Matchers];
    getDevice: (
        action: ActionFromMatcher<Matchers[number]>,
        state: StorageMiddlewareState,
    ) => TrezorDevice | undefined;
    save: (
        params: RememberedDeviceSaveParams<ActionFromMatcher<Matchers[number]>>,
        deps: RememberedDeviceSaveDeps,
    ) => void;
}): RememberedDeviceHandler => handler;

// Device-scoped data must be persisted only for remembered devices. Do not check
// getIsDeviceRemembered by hand — register a handler here and the loop in the middleware below
// applies the check based on the declared getDevice.
const rememberedDeviceHandlers: RememberedDeviceHandler[] = [
    defineRememberedDeviceHandler({
        match: [
            accountsActions.createAccount.match,
            accountsActions.changeAccountVisibility.match,
            accountsActions.updateAccount.match,
        ],
        getDevice: (action, state) =>
            findAccountDevice(action.payload.account, selectDevices(state)),
        save: ({ action }, deps) => {
            const account = selectAccountByKey(deps.getState(), action.payload.account.key);
            if (!account) return;

            if (!isAccountSuccessful(account)) {
                return;
            }

            storageActions.saveAccounts(deps, [account]);
            deps.dispatch(storageActions.saveCoinjoinAccountThunk(account.key));
        },
    }),
    defineRememberedDeviceHandler({
        // When setDeviceState/addAuthorizedDevice is dispatched for passphrase wallet, it means
        // that its device was just created, but already discovered accounts may have not been
        // persisted, so try to do it now.
        match: [deviceActions.setDeviceState.match, deviceActions.addAuthorizedDevice.match],
        getDevice: (action, state) => selectDeviceByState(state, action.payload.state),
        save: ({ action, device }, deps) => {
            if (device.useEmptyPassphrase) {
                return;
            }

            const accounts = selectAccountsByDeviceState(
                deps.getState(),
                action.payload.state,
            ).filter(isAccountSuccessful);

            storageActions.saveAccounts(deps, accounts);
        },
    }),
    defineRememberedDeviceHandler({
        // If there is a change in account.metadata (metadataActions.setAccountLoaded), update database.
        match: [metadataActions.setAccountAdd.match],
        getDevice: (action, state) => findAccountDevice(action.payload, selectDevices(state)),
        save: ({ action }, deps) => {
            if (!isAccountSuccessful(action.payload)) {
                return;
            }

            storageActions.saveAccounts(deps, [action.payload]);
        },
    }),
    defineRememberedDeviceHandler({
        match: [
            receiveActions.showAddress.match,
            receiveActions.touchAddress.match,
            receiveActions.setCurrentFreshAddress.match,
        ],
        getDevice: (action, state) => getDeviceByAccountKey(action.payload.accountKey, state),
        save: ({ action }, deps) => {
            deps.dispatch(storageActions.saveAccountReceiveThunk(action.payload.accountKey));
        },
    }),
    defineRememberedDeviceHandler({
        match: [earnOnboardingActions.confirmEarnOnboarding.match],
        getDevice: (action, state) => getDeviceByAccountKey(action.payload.accountKey, state),
        save: ({ action }, deps) => {
            deps.dispatch(storageActions.saveEarnOnboardingThunk(action.payload.accountKey));
        },
    }),
    defineRememberedDeviceHandler({
        match: [
            transactionsActions.addTransaction.match,
            transactionsActions.removeTransaction.match,
        ],
        getDevice: (action, state) =>
            findAccountDevice(action.payload.account, selectDevices(state)),
        save: ({ action }, deps) => {
            const { account } = action.payload;

            storageActions.removeAccountTransactions(deps, account);
            deps.dispatch(storageActions.saveAccountTransactionsThunk(account));
        },
    }),
    defineRememberedDeviceHandler({
        match: [transactionsActions.markTransactionAsNotScam.match],
        getDevice: (action, state) => getDeviceByAccountKey(action.payload.key, state),
        save: ({ action }, deps) => {
            const account = selectAccountByKey(deps.getState(), action.payload.key);

            if (account) {
                deps.dispatch(storageActions.saveAccountTransactionsThunk(account));
            }
        },
    }),
    defineRememberedDeviceHandler({
        match: [
            transactionsActions.removeTransaction.match,
            updateTxsFiatRatesThunk.fulfilled.match,
        ],
        getDevice: (action, state) => {
            const { account } = action.payload;

            return account ? getDeviceByAccountKey(account.key, state) : undefined;
        },
        save: ({ action }, deps) => {
            const { account } = action.payload;

            if (!account) {
                return;
            }

            storageActions.removeAccountHistoricRates(deps, account.key);

            const historicRates = selectHistoricFiatRates(deps.getState());
            if (historicRates) {
                deps.dispatch(
                    storageActions.saveAccountHistoricRatesThunk(account.key, historicRates),
                );
            }
        },
    }),
    defineRememberedDeviceHandler({
        match: [deviceActions.updateSelectedDevice.match],
        getDevice: action => action.payload,
        save: ({ device }, deps) => {
            const isAutoEjectEnabled = selectIsDeviceAutoEjectEnabled(deps.getState());

            if (device.mode !== 'normal' || isAutoEjectEnabled) {
                return;
            }

            (storageActions.saveAccounts(deps, []) ?? Promise.resolve())
                // This is a bit strange workaround to ensure that device data will be stored after all account-related db transactions are settled,
                // in order not to persist successful discovery before persisting all its accounts
                .then(() => storageActions.saveDevice(deps, device));
        },
    }),
    defineRememberedDeviceHandler({
        match: [suiteSettingsActions.setCoinjoinReceiveWarningHidden.match],
        getDevice: (_action, state) => selectSelectedDevice(state),
        save: (_params, deps) => {
            deps.dispatch(storageActions.saveSuiteSettingsThunk());
        },
    }),
    defineRememberedDeviceHandler({
        match: [accountGraphSuccess.match, accountGraphFail.match],
        getDevice: (action, state) =>
            selectDevices(state).find(
                device => device.state?.staticSessionId === action.payload.account.deviceState,
            ),
        save: ({ action }, deps) => {
            const { account } = action.payload;
            const graphEntry = selectGraph(deps.getState()).data.find(
                d =>
                    d.account.deviceState === account.deviceState &&
                    d.account.descriptor === account.descriptor &&
                    d.account.symbol === account.symbol,
            );
            if (graphEntry) {
                storageActions.saveGraph(deps, [graphEntry]);
            }
        },
    }),
    defineRememberedDeviceHandler({
        match: [metadataActions.setErrorForDevice.match],
        getDevice: (action, state) =>
            selectDeviceByStaticSessionId(state, action.payload.deviceState),
        save: ({ device }, deps) => {
            deps.dispatch(storageActions.saveDeviceMetadataErrorThunk(device));
        },
    }),
    defineRememberedDeviceHandler({
        // Au, this hurts, I need to call saveDevice manually. Saved device should be updated
        // automatically anytime any of its properties change.
        match: [metadataActions.setDeviceMetadata.match],
        getDevice: (action, state) =>
            selectDeviceByStaticSessionId(state, action.payload.deviceState),
        save: ({ action, device }, deps) => {
            storageActions.saveDevice(deps, {
                ...device,
                metadata: action.payload.metadata,
            });
        },
    }),
    defineRememberedDeviceHandler({
        match: [isCoinjoinAccountPersistenceAction],
        getDevice: (action, state) =>
            getDeviceByAccountKey(action.payload.accountKey as AccountKey, state),
        save: ({ action }, deps) => {
            deps.dispatch(
                storageActions.saveCoinjoinAccountThunk(action.payload.accountKey as AccountKey),
            );
        },
    }),
];

export const prepareStorageMiddleware = createMiddlewareWithExtraDeps<
    StorageMiddlewareDeps,
    UnknownAction,
    StorageMiddlewareState
>((action, api) => {
    // pass action
    api.next(action);

    // IMPORTANT: The single place enforcing that device-scoped data is persisted only for
    //            remembered devices (see rememberedDeviceHandlers above).
    rememberedDeviceHandlers.forEach(({ match, getDevice, save }) => {
        if (!match.some(matcher => matcher(action))) {
            return;
        }

        const device = getDevice(action, api.getState());

        if (device && getIsDeviceRemembered(device)) {
            save(
                { action, device },
                { db: api.extra.services.db, dispatch: api.dispatch, getState: api.getState },
            );
        }
    });

    if (accountsActions.removeAccount.match(action)) {
        action.payload.forEach(
            storageActions.removeAccountWithDependencies({
                db: api.extra.services.db,
                getState: api.getState,
            }),
        );
    }

    if (changeNetworks.match(action)) {
        api.dispatch(storageActions.saveWalletSettingsThunk());
    }

    if (transactionsActions.resetTransaction.match(action)) {
        const { account } = action.payload;

        storageActions.removeAccountTransactions(api.extra.services, account);
        storageActions.removeAccountHistoricRates(api.extra.services, account.key);
        storageActions.removeAccountPhishing(api.extra.services, account.key);
    }

    if (phishingActions.setDustPhishing.match(action)) {
        api.dispatch(
            storageActions.savePhishingMetadataThunk({
                dustPhishing: action.payload,
            }),
        );
    }

    if (blockchainActions.setBackend.match(action)) {
        api.dispatch(storageActions.saveBackendThunk(action.payload.symbol));
    }

    if (blockchainActions.setBackendGapLimit.match(action)) {
        api.dispatch(storageActions.saveBackendThunk(action.payload.symbol));
    }

    if (explorerActions.setExplorer.match(action)) {
        storageActions.saveExplorer(api.extra.services, action.payload);
    }

    if (
        isAnyOf(
            messageSystemActions.fetchSuccessUpdate,
            messageSystemActions.dismissMessage,
            messageSystemActions.setConfigSource,
        )(action)
    ) {
        api.dispatch(storageActions.saveMessageSystemThunk());
    }

    if (
        isAnyOf(
            analyticsActions.initAnalytics,
            analyticsActions.enableAnalytics,
            analyticsActions.disableAnalytics,
            analyticsActions.setCustomAnalyticsUrl,
            analyticsActions.setLoggerEnabled,
        )(action)
    ) {
        api.dispatch(storageActions.saveAnalyticsThunk());
    }

    if (
        isAnyOf(
            updateSuiteSyncDebugEnabled,
            updateSuiteSyncEnabled,
            dismissUnsupportedDeviceBanner,
            setSuiteSyncRelayUrl,
        )(action)
    ) {
        api.dispatch(storageActions.saveSuiteSyncSettingsThunk());
    }

    if (setSuiteSyncOwner.match(action)) {
        api.dispatch(storageActions.saveSuiteSyncOwnerThunk(action.payload));
    }

    if (
        isAnyOf(
            suiteSyncQuotaManagerActions.quotaManagerDeviceFetched,
            suiteSyncQuotaManagerActions.updateQuotaManagerBaseUrl,
            suiteSyncQuotaManagerActions.enforceQuotaManagerUpdated,
            suiteSyncQuotaManagerActions.eraseFetchedData,
        )(action)
    ) {
        api.dispatch(storageActions.saveSuiteSyncQuotaManagerThunk());
    }

    if (deviceActions.setRememberDevice.match(action)) {
        const isAutoEjectEnabled = selectIsDeviceAutoEjectEnabled(api.getState());

        if (action.payload.remember && !isAutoEjectEnabled) {
            api.dispatch(storageActions.rememberDeviceThunk(action.payload.device));
        } else {
            api.dispatch(storageActions.forgetDeviceThunk(action.payload.device));
        }
    }

    if (deviceActions.forgetDevice.match(action)) {
        api.dispatch(storageActions.forgetDeviceThunk(action.payload.device));
    }

    if (tokenDefinitionsActions.setTokenStatus.match(action)) {
        api.dispatch(
            storageActions.saveTokenManagementThunk(
                action.payload.symbol,
                action.payload.type,
                TokenManagementAction.HIDE,
            ),
        );
        api.dispatch(
            storageActions.saveTokenManagementThunk(
                action.payload.symbol,
                action.payload.type,
                TokenManagementAction.SHOW,
            ),
        );
    }

    if (
        isAnyOf(
            deviceActions.connectDevice, // Known device is stored
            deviceActions.connectUnacquiredDevice, // Known device is stored
            bluetoothActions.knownDevicesUpdateAction,
            bluetoothActions.removeKnownDeviceAction,
            bluetoothActions.deviceUpdateAction, // Known devices may be updated
        )(action)
    ) {
        api.dispatch(storageActions.saveKnownDevicesThunk());
    }

    if (
        isAnyOf(
            connectPopupActions.rememberAppPermissions,
            connectPopupActions.forgetAppPermissions,
            connectPopupActions.forgetAppPermission,
            connectPopupActions.setAppSilentMode,
            walletConnectActions.saveSession,
            walletConnectActions.removeSession,
        )(action)
    ) {
        api.dispatch(storageActions.saveConnectSettingsThunk());
    }

    if (firmwareActions.setFirmwareChannel.match(action)) {
        api.dispatch(storageActions.saveFirmwareSettingsThunk());
    }

    if (isAnyOf(featureUsed, feedbackRequested, feedbackDismissed)(action)) {
        api.dispatch(storageActions.saveFeatureFeedbackThunk());
    }

    if (
        thpActions.removeCredentials.match(action) ||
        isDeviceEventOfType(action, DEVICE.THP_CREDENTIALS_CHANGED) ||
        (isDeviceEventOfType(action, DEVICE.THP_PAIRING_STATUS_CHANGED) &&
            action.payload.status === 'finished')
    ) {
        api.dispatch(storageActions.saveThpCredentialsThunk());
    }

    if (
        isAnyOf(
            deviceActions.connectDevice,
            deviceActions.deviceChanged,
            deviceActions.setEntropyCheckResult,
            deviceActions.setDeviceAuthenticityResult,
            deviceActions.setManualDeviceCheckSuccess,
            deviceActions.clearDevicePersistentData,
            deviceActions.forgetDevicePersistentData,
        )(action)
    ) {
        api.dispatch(storageActions.savePersistentDeviceDataThunk());
    }

    if (discreetModeActions.setDiscreetMode.match(action)) {
        api.dispatch(storageActions.saveDiscreetModeThunk());
    }

    if (
        isAnyOf(
            setBaseCurrency,
            setBitcoinAmountUnits,
            setMevProtection,
            setNetworkReserve,
            setAutoEjectEnabled,
            setAddressDisplayType,
            setSuspiciousTransactionsFilter,
        )(action)
    ) {
        api.dispatch(storageActions.saveWalletSettingsThunk());
    } else if (
        isAnyOf(
            suiteSettingsActions.setLanguage,
            setFlag,
            markNewContentIndicatorAsSeen,
            setNewContentIndicatorSeen,
            suiteSettingsActions.setDebugMode,
            suiteSettingsActions.setExperimentalFeatures,
            suiteSettingsActions.setOnionLinks,
            suiteSettingsActions.setTheme,
            suiteSettingsActions.setAutodetect,
            suiteSettingsActions.setSidebarWidth,
            suiteSettingsActions.toggleDeviceAuthenticityCheck,
            suiteSettingsActions.toggleFirmwareRevisionCheck,
            suiteSettingsActions.toggleFirmwareHashCheck,
            suiteSettingsActions.toggleDeviceMetaChecks,
            suiteSettingsActions.setIsCoinsFilterVisible,
            closeEvmExplanationBanner,
            confirmEvmExplanationModal,
        )(action)
    ) {
        api.dispatch(storageActions.saveSuiteSettingsThunk());
    } else if (debugActions.setShowDebugMenu.match(action)) {
        api.dispatch(storageActions.saveDebugSettingsThunk());
    } else if (tradingActions.saveTrade.match(action)) {
        storageActions.saveTradingTrade(api.extra.services, action.payload);
    } else if (
        metadataActions.enableMetadata.match(action) ||
        metadataActions.disableMetadata.match(action) ||
        metadataActions.addMetadataProvider.match(action) ||
        metadataActions.removeMetadataProvider.match(action)
    ) {
        api.dispatch(storageActions.saveMetadataSettingsThunk());
    } else if (setDebugSettings.match(action)) {
        api.dispatch(storageActions.saveCoinjoinDebugSettingsThunk());
    } else if (clientOnPrisonEvent.match(action)) {
        // Not a rememberedDeviceHandlers entry: unlike those handlers (one action ->
        // one device), this one action affects multiple accounts on potentially
        // different devices, so the remembered-device check must be applied per account.
        const affectedAccounts = action.payload.map(inmate => inmate.accountKey as AccountKey);
        const state = api.getState();
        affectedAccounts.forEach(key => {
            const device = getDeviceByAccountKey(key, state);
            if (device && getIsDeviceRemembered(device)) {
                api.dispatch(storageActions.saveCoinjoinAccountThunk(key));
            }
        });
    }

    return action;
});
