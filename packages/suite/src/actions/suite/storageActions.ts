import { selectKnownDevices } from '@suite-common/bluetooth';
import { MetadataState } from '@suite-common/metadata-types';
import { ExtraDependencies, createThunk } from '@suite-common/redux-utils/';
import { isDeviceAcquired } from '@suite-common/suite-utils';
import { selectThp } from '@suite-common/thp';
import { notificationsActions } from '@suite-common/toast-notifications';
import { DefinitionType, TokenManagementAction } from '@suite-common/token-definitions';
import type { TradingTransaction } from '@suite-common/trading';
import type { Explorer, NetworkSymbol } from '@suite-common/wallet-config';
import { FormDraftPrefixKeyValues } from '@suite-common/wallet-constants';
import {
    deviceActions,
    selectDevices,
    selectPersistentDeviceData,
} from '@suite-common/wallet-core';
import type {
    AccountKey,
    FormState,
    RatesByTimestamps,
    SuccessfulAccount,
} from '@suite-common/wallet-types';
import { FormDraftKeyPrefix } from '@suite-common/wallet-types';
import {
    getFormDraftKey,
    isAccountSuccessful,
    selectHistoricRatesByTransactions,
} from '@suite-common/wallet-utils';
import { cloneObject } from '@trezor/utils';

import { selectCoinjoinAccountByKey } from 'src/reducers/wallet/coinjoinReducer';
import type { DbDep } from 'src/storage';
import { asSuiteServices } from 'src/support/extraDependencies';
import type { PreloadStoreAction } from 'src/support/suite/preloadStore';
import type { AppState, Dispatch, GetState, TrezorDevice } from 'src/types/suite';
import type { Account } from 'src/types/wallet';
import { GraphData } from 'src/types/wallet/graph';
import { serializeCoinjoinAccount, serializeDevice } from 'src/utils/suite/storage';
import { deviceGraphDataFilterFn } from 'src/utils/wallet/graph';

import { STORAGE } from './constants';
import { DesktopBluetoothDevice } from '../bluetooth/DesktopBluetoothDevice';

type Db = DbDep['db'];

export type StorageAction = NonNullable<PreloadStoreAction>;
export type StorageLoadAction = Extract<StorageAction, { type: typeof STORAGE.LOAD }>;

export const saveExplorer = (
    db: Db,
    {
        symbol,
        explorer,
    }: {
        symbol: NetworkSymbol;
        explorer?: Explorer;
    },
) => {
    if (!db.isAccessible()) return;

    db.removeItemByPK('explorer', symbol);

    if (explorer !== undefined) {
        return db.addItem('explorer', { symbol, explorer }, symbol);
    }
};

export const saveDraft = (db: Db, formState: FormState, accountKey: AccountKey) => {
    if (!db.isAccessible()) return;

    return db.addItem('sendFormDrafts', formState, accountKey, true);
};

export const removeDraft = (db: Db, accountKey: AccountKey) => {
    if (!db.isAccessible()) return;

    return db.removeItemByPK('sendFormDrafts', accountKey);
};

export const saveAccountDraft =
    (account: Account) => (_: Dispatch, getState: GetState, extra: ExtraDependencies) => {
        const { db } = asSuiteServices(extra.services);
        if (!db.isAccessible()) return;
        const { drafts } = getState().wallet.send;
        const draft = drafts[account.key];
        if (draft) {
            return db.addItem('sendFormDrafts', draft, account.key, true);
        }
    };
const removeAccountDraft = (db: Db, account: Account) => {
    if (!db.isAccessible()) return Promise.resolve();

    return db.removeItemByPK('sendFormDrafts', account.key);
};

export const saveCoinjoinAccount =
    (accountKey: AccountKey) => (_: Dispatch, getState: GetState, extra: ExtraDependencies) => {
        const { db } = asSuiteServices(extra.services);
        const coinjoinAccount = selectCoinjoinAccountByKey(getState(), accountKey);
        if (!coinjoinAccount || !db.isAccessible()) return;
        const serializedAccount = serializeCoinjoinAccount(coinjoinAccount);

        return db.addItem('coinjoinAccounts', serializedAccount, accountKey, true);
    };

const removeCoinjoinRelatedSetting = (db: Db, state: AppState) => {
    const settings = { ...state.suite.settings };

    settings.isCoinjoinReceiveWarningHidden = false;

    db.addItem(
        'suiteSettings',
        {
            settings,
            flags: state.suite.flags,
            evmSettings: state.suite.evmSettings,
            seenDisconnectNotificationForDeviceIds:
                state.suite.seenDisconnectNotificationForDeviceIds,
            stakingDashboardCollapsed: state.suite.stakingDashboardCollapsed,
        },
        'suite',
        true,
    );
};

export const removeCoinjoinAccount = async (db: Db, accountKey: string, state: AppState) => {
    if (!db.isAccessible()) return;

    await db.removeItemByPK('coinjoinAccounts', accountKey);

    const savedCoinjoinAccounts = await db.getItemsExtended('coinjoinAccounts');
    if (!savedCoinjoinAccounts.length) {
        removeCoinjoinRelatedSetting(db, state);
    }
};

export const saveCoinjoinDebugSettings =
    () => (_dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => {
        const { db } = asSuiteServices(extra.services);
        if (!db.isAccessible()) return;
        const { debug } = getState().wallet.coinjoin;
        db.addItem('coinjoinDebugSettings', debug || {}, 'debug', true);
    };

export const saveThpCredentials = createThunk(
    `${STORAGE.MODULE_PREFIX}/saveThpCredentials`,
    async (_, { getState, extra }) => {
        const { db } = asSuiteServices(extra.services);
        if (!db.isAccessible()) return;
        const { credentials } = selectThp(getState());
        await db.addItem('thp', { credentials }, 'value', true);
    },
);

export const saveKnownDevices = createThunk(
    `${STORAGE.MODULE_PREFIX}/saveKnownDevices`,
    async (_, { getState, extra }) => {
        const { db } = asSuiteServices(extra.services);

        if (!db.isAccessible()) return;
        const knownDevices = selectKnownDevices<DesktopBluetoothDevice>(getState());

        await db.addItem(
            'bluetooth',
            {
                knownDevices: knownDevices.map(
                    (it): DesktopBluetoothDevice => ({
                        id: it.id,
                        name: it.name,
                        macAddress: it.macAddress,
                        manufacturerData: it.manufacturerData,
                        lastUpdatedTimestamp: it.lastUpdatedTimestamp,
                        paired: it.paired,
                        rssi: it.rssi,
                        deviceId: it.deviceId,

                        // Those fields are reset to prevent some state-inconsistency and UI flickering
                        connectionStatus: { type: 'disconnected' },
                    }),
                ),
            },
            'value',
            true,
        );
    },
);

export const saveAccountFormDraft =
    (prefix: FormDraftKeyPrefix, accountKey: string) =>
    (_: Dispatch, getState: GetState, extra: ExtraDependencies) => {
        const { db } = asSuiteServices(extra.services);
        if (!db.isAccessible()) return;

        const { formDrafts } = getState().wallet;

        const formDraftKey = getFormDraftKey(prefix, accountKey);
        const formDraft = formDrafts[formDraftKey];

        return formDraft ? db.addItem('formDrafts', formDraft, formDraftKey, true) : undefined;
    };

const removeAccountFormDraft = (db: Db, prefix: FormDraftKeyPrefix, accountKey: string) => {
    if (!db.isAccessible()) return;

    return db.removeItemByPK('formDrafts', getFormDraftKey(prefix, accountKey));
};

export const saveDevice = (db: Db, device: TrezorDevice) => {
    if (!db.isAccessible()) return;
    if (!isDeviceAcquired(device) || !device.state?.staticSessionId) return;

    return db.addItem('devices', serializeDevice(device), device.state.staticSessionId, true);
};

const removeAccount = (db: Db, account: Account) => {
    if (!db.isAccessible()) return;

    return db.removeItemByPK('accounts', [account.descriptor, account.symbol, account.deviceState]);
};

export const removeAccountTransactions = async (db: Db, account: Account) => {
    if (!db.isAccessible()) return;
    await db.removeItemByIndex('txs', 'accountKey', [
        account.descriptor,
        account.symbol,
        account.deviceState,
    ]);
};

const removeAccountGraph = (db: Db, account: Account) => {
    if (!db.isAccessible()) return;

    return db.removeItemByIndex('graph', 'accountKey', [
        account.descriptor,
        account.symbol,
        account.deviceState,
    ]);
};

export const removeAccountHistoricRates = (db: Db, accountKey: string) => {
    if (!db.isAccessible()) return;

    return db.removeItemByPK('historicRates', accountKey);
};

export const removeAccountWithDependencies = (db: Db, getState: GetState) => (account: Account) =>
    Promise.all([
        ...FormDraftPrefixKeyValues.map(prefix => removeAccountFormDraft(db, prefix, account.key)),
        removeAccountDraft(db, account),
        removeAccountTransactions(db, account),
        removeAccountGraph(db, account),
        removeCoinjoinAccount(db, account.key, getState()),
        removeAccount(db, account),
        removeAccountHistoricRates(db, account.key),
    ]);

export const forgetDevice =
    (device: TrezorDevice) => (_: Dispatch, getState: GetState, extra: ExtraDependencies) => {
        const { db } = asSuiteServices(extra.services);
        if (!db.isAccessible()) return;
        if (!device.state?.staticSessionId) return;
        const { staticSessionId } = device.state;

        const accounts = getState().wallet.accounts.filter(a => a.deviceState === staticSessionId);

        // forget device metadata error
        const metadataError = getState().metadata?.error;
        let error;
        if (metadataError) {
            error = cloneObject(metadataError);
            delete error[device.state.staticSessionId];
        }

        return Promise.all([
            db.removeItemByPK('devices', staticSessionId),
            db.removeItemByIndex('accounts', 'deviceState', staticSessionId),
            db.removeItemByIndex('txs', 'deviceState', staticSessionId),
            db.removeItemByIndex('graph', 'deviceState', staticSessionId),
            ...accounts.map(removeAccountWithDependencies(db, getState)),
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            ...(error ? [saveMetadata(db, { error })] : []),
        ]);
    };

export const saveAccounts = (db: Db, accounts: SuccessfulAccount[]) => {
    if (!db.isAccessible()) return;

    return db.addItems('accounts', accounts, true);
};

export const saveTradingTrade = (db: Db, trade: TradingTransaction) => {
    if (!db.isAccessible()) return;

    return db.addItem('tradingTrades', trade, undefined, true);
};

export const saveGraph = (db: Db, graphData: GraphData[]) => {
    if (!db.isAccessible()) return;

    return db.addItems('graph', graphData, true);
};

export const saveAccountHistoricRates =
    (accountKey: AccountKey, historicRates: RatesByTimestamps) =>
    (_dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => {
        const { db } = asSuiteServices(extra.services);
        if (!db.isAccessible()) return Promise.resolve();
        const allTxs = getState().wallet.transactions.transactions;
        const accTxs = (allTxs[accountKey] || []).filter(tx => !!tx);

        const accHistoricRates = selectHistoricRatesByTransactions(historicRates, accTxs);

        return db.addItem('historicRates', accHistoricRates, accountKey, true);
    };

export const saveAccountTransactions =
    (account: Account) => (_dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => {
        const { db } = asSuiteServices(extra.services);
        if (!db.isAccessible()) return Promise.resolve();
        const allTxs = getState().wallet.transactions.transactions;
        const accTxs = allTxs[account.key] || [];

        // wrap txs and add its order inside the array
        const orderedTxs = accTxs.map((tx, order) => ({ tx, order })).filter(({ tx }) => !!tx);

        return db.addItems('txs', orderedTxs, true);
    };

export const rememberDevice =
    (device: TrezorDevice) =>
    async (dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => {
        const { db } = asSuiteServices(extra.services);
        if (!db.isAccessible()) return;
        if (!isDeviceAcquired(device) || !device.state?.staticSessionId) return;

        const { wallet } = getState();
        const accounts = wallet.accounts
            .filter(isAccountSuccessful)
            .filter(a => a.deviceState === device.state?.staticSessionId);

        const graphData = wallet.graph.data.filter(d =>
            deviceGraphDataFilterFn(d, device.state?.staticSessionId),
        );
        const historicRates = wallet.fiat.historic;

        const accountPromises = accounts.reduce<Array<unknown | Promise<unknown>>>(
            (promises, account) =>
                promises.concat(
                    [
                        dispatch(saveAccountTransactions(account)),
                        dispatch(saveAccountDraft(account)),
                        dispatch(saveCoinjoinAccount(account.key)),
                        dispatch(saveAccountHistoricRates(account.key, historicRates)),
                    ],
                    FormDraftPrefixKeyValues.map(prefix =>
                        dispatch(saveAccountFormDraft(prefix, account.key)),
                    ),
                ),
            [],
        );

        try {
            await Promise.all([
                saveDevice(db, device),
                saveAccounts(db, accounts),
                saveGraph(db, graphData),
                // eslint-disable-next-line  @typescript-eslint/no-use-before-define
                dispatch(saveDeviceMetadataError(device)),
                ...accountPromises,
            ]);
        } catch (error) {
            console.error('Remember device:', error);
        }
    };

export const saveWalletSettings =
    () => async (_dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => {
        const { db } = asSuiteServices(extra.services);
        if (!db.isAccessible()) return;
        await db.addItem(
            'walletSettings',
            {
                ...getState().wallet.settings,
            },
            'wallet',
            true,
        );
    };
export const saveBackend =
    (symbol: NetworkSymbol) =>
    async (_dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => {
        const { db } = asSuiteServices(extra.services);
        if (!db.isAccessible()) return;
        await db.addItem(
            'backendSettings',
            getState().wallet.blockchain[symbol].backends,
            symbol,
            true,
        );
    };

export const saveSuiteSettings =
    () =>
    (_dispatch: Dispatch, getState: GetState, extra: ExtraDependencies): Promise<void> => {
        const { db } = asSuiteServices(extra.services);
        if (!db.isAccessible()) return Promise.resolve();
        const { suite } = getState();

        const result = db.addItem(
            'suiteSettings',
            {
                settings: {
                    ...suite.settings,
                    // Temporary measure to always start Suite with password manager off
                    experimental: suite.settings.experimental?.filter(
                        e => e !== 'password-manager',
                    ),
                },
                flags: suite.flags,
                evmSettings: suite.evmSettings,
                seenDisconnectNotificationForDeviceIds:
                    suite.seenDisconnectNotificationForDeviceIds,
                stakingDashboardCollapsed: suite.stakingDashboardCollapsed,
            },
            'suite',
            true,
        );

        return result.then(() => {});
    };

export const saveTokenManagement =
    (symbol: NetworkSymbol, type: DefinitionType, status: TokenManagementAction) =>
    async (_dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => {
        const { db } = asSuiteServices(extra.services);
        if (!db.isAccessible()) return;
        const { tokenDefinitions } = getState();
        const tokenDefinitionsType = tokenDefinitions[symbol]?.[type];
        const data = tokenDefinitionsType?.[status];

        const key = `${symbol}-${type}-${status}`;

        await db.removeItemByPK('tokenManagement', key);

        return data ? db.addItem('tokenManagement', data, key, true) : undefined;
    };

export const saveAnalytics =
    () => (_dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => {
        const { db } = asSuiteServices(extra.services);
        if (!db.isAccessible()) return;

        const { analytics } = getState();
        db.addItem(
            'analytics',
            {
                enabled: analytics.enabled,
                instanceId: analytics.instanceId,
                confirmed: analytics.confirmed,
            },
            'suite',
            true,
        );
    };

type MetadataPersistentKeys = 'providers' | 'enabled' | 'selectedProvider' | 'error';

const saveMetadata = async (
    db: Db,
    metadata: Partial<Pick<MetadataState, MetadataPersistentKeys>>,
) => {
    if (!db.isAccessible()) return;

    // remove undefined in metadata arg
    (Object.keys as unknown as (args: any) => MetadataPersistentKeys[])(metadata).forEach(
        (key: MetadataPersistentKeys) => {
            if (typeof metadata[key] === 'undefined') {
                delete metadata[key];
            }
        },
    );
    const savedMetadata = await db.getItemByPK('metadata', 'state');
    const nextMetadata = { ...savedMetadata, ...metadata } as Pick<
        MetadataState,
        MetadataPersistentKeys
    >;

    await db.addItem('metadata', nextMetadata, 'state', true);
};

/**
 * save general metadata settings
 * obsolete - will be replaced with labeling settings
 */
export const saveMetadataSettings =
    () => async (_dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => {
        const { db } = asSuiteServices(extra.services);
        // for some strage race-condition reason it has to be awaited, so that the getState runs async
        if (!(await db.isAccessible())) return;

        const { metadata } = getState();

        await saveMetadata(db, {
            providers: metadata.providers,
            enabled: metadata.enabled,
            selectedProvider: metadata.selectedProvider,
        });
    };

export const saveSuiteSyncSettings =
    () => (_dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => {
        const { db } = asSuiteServices(extra.services);
        if (!db.isAccessible()) return;

        const { suiteSync } = getState();

        return db.addItem(
            'suiteSyncSettings',
            {
                isSuiteSyncEnabled: suiteSync.settings.isSuiteSyncEnabled,
                isSuiteSyncDebugEnabled: suiteSync.settings.isSuiteSyncDebugEnabled,
                suiteSyncRelayUrl: suiteSync.settings.suiteSyncRelayUrl,
            },
            'suiteSyncSettings',
            true,
        );
    };

export const saveSuiteSyncQuotaManager =
    () => (_dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => {
        const { db } = asSuiteServices(extra.services);
        if (!db.isAccessible()) return;

        const { suiteSyncQuotaManager } = getState();

        return db.addItem(
            'suiteSyncQuotaManager',
            {
                baseUrl: suiteSyncQuotaManager.baseUrl,
                enabled: suiteSyncQuotaManager.enabled,
                registeredDevices: suiteSyncQuotaManager.registeredDevices,
                ownersAllowance: suiteSyncQuotaManager.ownersAllowance,
            },
            'suiteSyncQuotaManager',
            true,
        );
    };

export const saveDeviceMetadataError =
    (device: TrezorDevice) =>
    async (_dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => {
        const { db } = asSuiteServices(extra.services);
        if (!db.isAccessible()) return;

        const { metadata } = getState();
        if (device.state?.staticSessionId && metadata?.error?.[device.state.staticSessionId]) {
            const { error } = metadata;
            await saveMetadata(db, { error });
        }
    };

export const saveMessageSystem =
    () => (_dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => {
        const { db } = asSuiteServices(extra.services);
        if (!db.isAccessible()) return;

        const {
            dismissedMessages,
            config,
            currentSequence,
            configSource,
            manuallyAddedMessageIds,
            manuallyAddedExperimentIds,
        } = getState().messageSystem;

        db.addItem(
            'messageSystem',
            {
                config,
                currentSequence,
                dismissedMessages,
                configSource,
                manuallyAddedMessageIds,
                manuallyAddedExperimentIds,
            },
            'suite',
            true,
        );
    };

export const savePersistentDeviceData =
    () => async (_dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => {
        const { db } = asSuiteServices(extra.services);
        if (!db.isAccessible()) return;
        const data = selectPersistentDeviceData(getState());

        await db.addItem('persistentDeviceData', data, 'persistentDeviceData', true);
    };

export const saveConnectSettings =
    () => (_dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => {
        const { db } = asSuiteServices(extra.services);
        if (!db.isAccessible()) return;
        const { connectPopup, walletConnect } = getState();

        db.addItem(
            'connect',
            {
                permissions: connectPopup.permissions,
                walletConnectSessions: walletConnect.sessions,
            },
            'connect',
            true,
        );
    };

export const saveFirmwareSettings =
    () => (_dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => {
        const { db } = asSuiteServices(extra.services);
        if (!db.isAccessible()) return;
        const { firmware } = getState();

        db.addItem(
            'firmware',
            {
                firmwareUpdateSource: firmware.firmwareUpdateSource,
            },
            'firmware',
            true,
        );
    };

export const removeDatabase =
    () => async (dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => {
        const { db } = asSuiteServices(extra.services);
        if (!db.isAccessible()) return;

        const devices = selectDevices(getState());

        const rememberedDevices = devices.filter(d => d.remember);
        // forget all remembered devices
        rememberedDevices.forEach(d => {
            dispatch(deviceActions.forgetDevice({ device: d }));
        });
        await db.removeDatabase();
        dispatch(
            notificationsActions.addToast({
                type: 'clear-storage',
            }),
        );
    };
