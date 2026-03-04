import { analyticsInitialState } from '@suite-common/analytics-redux';
import { connectPopupInitialState } from '@suite-common/connect-popup';
import { deviceInitialState } from '@suite-common/device';
import { firmwareInitialState } from '@suite-common/firmware';
import { geolocationInitialState } from '@suite-common/geolocation';
import { logsSliceInitialState } from '@suite-common/logger';
import { messageSystemInitialState } from '@suite-common/message-system';
import { initialSuiteSyncDataState, initialSuiteSyncState } from '@suite-common/suite-sync';
import { quotaManagerInitialState } from '@suite-common/suite-sync-quota-manager';
import { initialThpState } from '@suite-common/thp';
import { createNotificationsReducer } from '@suite-common/toast-notifications';
import { tokenDefinitionsInitialState } from '@suite-common/token-definitions';
import {
    accountsInitialState,
    blockchainInitialState,
    discoveryInitialState,
    explorerInitialState,
    feesInitialState,
    fiatRatesInitialState,
    formDraftInitialState,
    initialWalletSettingsState,
    stakeInitialState,
    transactionsInitialState,
} from '@suite-common/wallet-core';
import { walletConnectInitialState } from '@suite-common/walletconnect';
import { bannerFlagsInitialState } from '@suite-native/banner-flags';
import { bluetoothInitialState } from '@suite-native/bluetooth';
import { deviceAuthorizationInitialState } from '@suite-native/device-authorization';
import { deviceOnboardingSliceInitialState } from '@suite-native/device-onboarding';
import { pendingCoinVisibilitySlice } from '@suite-native/discovery';
import { featureFlagsInitialState } from '@suite-native/feature-flags';
import { nativeFirmwareInitialState } from '@suite-native/firmware';
import { graphInitialState } from '@suite-native/graph';
import { TxKeyPath, localeInitialState } from '@suite-native/intl';
import { appSettingsInitialState } from '@suite-native/settings';
import { tradingInitialState } from '@suite-native/trading-state';
import { sendFormInitialState } from '@suite-native/transaction-management';

import { appSliceInitialState } from '../src/appSlice';
import type { FullAppState } from '../src/store';

/**
 * Create a complete app state for Suite Mobile to be used as basis for state fixtures in tests.
 */

export const mockInitialAppState = (partialState?: Partial<FullAppState>): FullAppState => ({
    analytics: analyticsInitialState,
    app: appSliceInitialState,
    appSettings: appSettingsInitialState,
    bannerFlags: bannerFlagsInitialState,
    bluetooth: bluetoothInitialState,
    connectPopup: connectPopupInitialState,
    device: deviceInitialState,
    deviceAuthorization: deviceAuthorizationInitialState,
    deviceOnboarding: deviceOnboardingSliceInitialState,
    featureFlags: featureFlagsInitialState,
    firmware: firmwareInitialState,
    geolocation: geolocationInitialState,
    graph: graphInitialState,
    locale: localeInitialState,
    logs: logsSliceInitialState,
    messageSystem: messageSystemInitialState,
    nativeFirmware: nativeFirmwareInitialState,
    notifications: createNotificationsReducer<TxKeyPath>().initialState,
    pendingCoinVisibility: pendingCoinVisibilitySlice.getInitialState(),
    suiteSync: initialSuiteSyncState,
    suiteSyncData: initialSuiteSyncDataState,
    thp: initialThpState,
    tokenDefinitions: tokenDefinitionsInitialState,
    walletConnect: walletConnectInitialState,
    suiteSyncQuotaManager: quotaManagerInitialState,

    wallet: {
        accounts: accountsInitialState,
        blockchain: blockchainInitialState,
        explorer: explorerInitialState,
        fiat: fiatRatesInitialState,
        transactions: transactionsInitialState,
        discovery: discoveryInitialState,
        send: sendFormInitialState,
        fees: feesInitialState,
        stake: stakeInitialState,
        trading: tradingInitialState,
        settings: initialWalletSettingsState,
        formDrafts: formDraftInitialState,
    },

    ...partialState,
});
