import type { PayloadAction } from '@reduxjs/toolkit';

import { fixLoadedCoinjoinAccount } from '@suite/coinjoin';
import type { FlagsState } from '@suite/flags';
import { lockDevice } from '@suite/locks';
import { metadataActions, metadataLabelingActions } from '@suite/metadata';
import { closeModal, openModal } from '@suite/modal';
import { type SuiteSettingsState } from '@suite/settings';
import { type DeviceReducerState } from '@suite-common/device';
import { type ExtraDependenciesStatic } from '@suite-common/extra-dependencies';
import { type ReceiveState } from '@suite-common/receive';
import { type WithServices } from '@suite-common/redux-utils';
import {
    type TokenDefinitionsMiddlewareDeps,
    type TokenDefinitionsState,
    buildTokenDefinitionsFromStorage,
} from '@suite-common/token-definitions';
import { isNetworkSymbol } from '@suite-common/wallet-config';
import {
    type BlockchainState,
    type ExplorerConfig,
    type FiatRatesState,
    type PhishingState,
    type SendState,
    type TransactionsState,
    type WalletSettingsState,
    changeNetworks,
} from '@suite-common/wallet-core';
import { createAccountKey } from '@suite-common/wallet-types';
import { buildHistoricRatesFromStorage, sortByCoin } from '@suite-common/wallet-utils';
import { type StaticSessionId } from '@trezor/connect';

import { type StorageLoadAction } from 'src/actions/suite/storageActions';

import { type SuiteServices } from './createSuiteCompositionRoot';
import { forgetBluetoothDeviceThunk } from '../actions/bluetooth/bluetoothEraseBondsThunk';
import type { BioAuthState } from '../reducers/bioAuth';
import { type TrezorDevice } from '../types/suite';

export type ExtraDependenciesSuite = ExtraDependenciesStatic &
    TokenDefinitionsMiddlewareDeps &
    WithServices<SuiteServices>;

export const extraDependencies: ExtraDependenciesStatic & TokenDefinitionsMiddlewareDeps = {
    thunks: {
        initMetadata: metadataLabelingActions.init,
        fetchAndSaveMetadata: metadataLabelingActions.fetchAndSaveMetadata,
        addAccountMetadata: metadataLabelingActions.addAccountMetadata,
        forgetBluetoothDevice: forgetBluetoothDeviceThunk,
    },
    actions: {
        setAccountAddMetadata: metadataActions.setAccountAdd,
        lockDevice,
        onModalCancel: closeModal,
        openModal,
        changeNetworks,
    },
    actionTypes: {
        storageLoad: '@storage/load',
        setDeviceMetadata: '@metadata/set-device-metadata',
        setDeviceMetadataPasswords: '@metadata/set-device-metadata-passwords',
    },
    reducers: {
        storageLoadBlockchain: (state: BlockchainState, { payload }: StorageLoadAction) => {
            payload.backendSettings.forEach(backend => {
                const blockchain = state[backend.key];

                if (blockchain) {
                    blockchain.backends = backend.value;
                }
            });
        },
        storageLoadExplorer: (state: ExplorerConfig, { payload }: StorageLoadAction) => {
            payload.explorer.forEach(({ symbol, explorer }) => {
                state[symbol] = {
                    ...state[symbol],
                    custom: explorer,
                };
            });
        },
        storageLoadTransactions: (state: TransactionsState, { payload }: StorageLoadAction) => {
            const { txs, phishing } = payload;

            txs.forEach(item => {
                const k = createAccountKey({
                    accountDescriptor: item.tx.descriptor,
                    networkSymbol: item.tx.symbol,
                    deviceStaticSessionId: item.tx.deviceState,
                });

                if (!state.transactions[k]) {
                    state.transactions[k] = [];
                }

                state.transactions[k][item.order] = item.tx;
            });

            phishing.forEach(({ key, value }) => {
                state.phishing[key] = value;
            });
        },
        storageLoadPhishingMetadata: (state: PhishingState, { payload }: StorageLoadAction) => {
            if (payload.phishingMetadata) {
                return { ...state, ...payload.phishingMetadata };
            }

            return state;
        },
        storageLoadHistoricRates: (state: FiatRatesState, { payload }: StorageLoadAction) => {
            if (payload.historicRates) {
                const fiatRates = payload.historicRates.map(rate => rate.value);
                const historicRates = buildHistoricRatesFromStorage(fiatRates);
                state.historic = historicRates;
            }
        },
        storageLoadTokenManagement: (
            state: TokenDefinitionsState,
            { payload }: StorageLoadAction,
        ) => {
            if (payload.tokenManagement) {
                const tokenDefinitions = buildTokenDefinitionsFromStorage(payload.tokenManagement);
                Object.keys(tokenDefinitions).forEach(symbol => {
                    if (isNetworkSymbol(symbol)) {
                        state[symbol] = tokenDefinitions[symbol];
                    }
                });
            }
        },
        storageLoadAccounts: (_, { payload }: StorageLoadAction) =>
            // Storage returns accounts in IndexedDB key order, sort them like the reducer does.
            sortByCoin(
                payload.accounts.map(acc =>
                    acc.backendType === 'coinjoin' ? fixLoadedCoinjoinAccount(acc) : acc,
                ),
            ),
        setDeviceMetadataReducer: (
            state: DeviceReducerState,
            {
                payload,
            }: PayloadAction<{ deviceState: StaticSessionId; metadata: TrezorDevice['metadata'] }>,
        ) => {
            const { deviceState, metadata } = payload;
            const index = state.devices.findIndex(
                (d: TrezorDevice) => d.state?.staticSessionId === deviceState,
            );
            const device = state.devices[index];
            if (!device) return;
            device.metadata = metadata;
        },
        setDeviceMetadataPasswordsReducer: (
            state: DeviceReducerState,
            {
                payload,
            }: PayloadAction<{
                deviceState: StaticSessionId;
                metadata: TrezorDevice['passwords'];
            }>,
        ) => {
            const { deviceState, metadata } = payload;
            const index = state.devices.findIndex(
                (d: TrezorDevice) => d.state?.staticSessionId === deviceState,
            );
            const device = state.devices[index];
            if (!device) return;
            device.passwords = metadata;
        },
        storageLoadDevices: (state: DeviceReducerState, { payload }: StorageLoadAction) => {
            // @ts-expect-error loaded devices have empty path, TODO deviceReducer should have path nullable, because remembered wallets??
            state.devices = payload.devices.map(device => {
                const persistentDeviceData = payload.persistentDeviceData?.find(
                    ({ device_id }) => device_id === device.id,
                );
                if (persistentDeviceData) {
                    return {
                        ...device,
                        thp: persistentDeviceData.thp,
                    };
                } else {
                    return device;
                }
            });

            state.persistentDeviceData = payload.persistentDeviceData ?? [];
        },
        storageLoadFormDrafts: (state: SendState, { payload }: StorageLoadAction) => {
            payload.sendFormDrafts.forEach(d => {
                state.drafts[d.key] = d.value;
            });
        },
        storageLoadWalletSettings: (state: WalletSettingsState, { payload }: StorageLoadAction) =>
            payload.walletSettings ? { ...state, ...payload.walletSettings } : state,
        // this is deprecated, bioAuth settings is now stored in electron store
        storageLoadBioAuth: (state: BioAuthState, { payload }: StorageLoadAction) => {
            if (!payload?.bioAuth) return state;

            // Only load the bioAuthEnabled property, ignore all other properties
            if (payload.bioAuth.bioAuthEnabled !== undefined) {
                return {
                    ...state,
                    bioAuthEnabled: payload.bioAuth.bioAuthEnabled,
                };
            }

            return state;
        },
        storageLoadFlags: (state: FlagsState, { payload }: StorageLoadAction) =>
            payload.suiteSettings?.flags
                ? {
                      ...state,
                      ...payload.suiteSettings.flags,
                      // The onboarding feedback banner is session-only: it is enabled when onboarding
                      // is completed and must not survive an app restart. Reset it on every load so a
                      // returning user only sees it again after completing onboarding once more.
                      showOnboardingFeedbackBanner: false,
                  }
                : state,
        storageLoadSuiteSettings: (state: SuiteSettingsState, { payload }: StorageLoadAction) => {
            if (!payload.suiteSettings?.settings) return state;

            const loadedSettings = payload.suiteSettings.settings;
            const theme =
                (loadedSettings.theme?.variant as string | undefined) === 'debug'
                    ? { ...loadedSettings.theme, variant: 'light' as const }
                    : loadedSettings.theme;

            return {
                ...state,
                ...loadedSettings,
                theme: theme ?? state.theme,
                enabledSecurityChecks: {
                    ...state.enabledSecurityChecks,
                    ...loadedSettings.enabledSecurityChecks,
                },
            };
        },
        storageLoadReceiveAccounts: (state: ReceiveState, { payload }: StorageLoadAction) => {
            state.accounts =
                payload.receive?.reduce<ReceiveState['accounts']>((accounts, { key, value }) => {
                    accounts[key] = {
                        touchedAddresses: value.touchedAddresses.map(({ path, address }) => ({
                            path,
                            address,
                        })),
                        currentFreshAddress: value.currentFreshAddress,
                    };

                    return accounts;
                }, {}) ?? {};
        },
    },
};
