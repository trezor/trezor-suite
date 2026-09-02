import { type Dispatch, type UnknownAction } from '@reduxjs/toolkit';
import { type ThunkDispatch } from 'redux-thunk';

import {
    type CoinjoinRootState,
    selectCoinjoinAccountByKey,
    selectCoinjoinDebug,
} from '@suite/coinjoin';
import { type DebugRootState, selectDebug } from '@suite/debug';
import { type FeedbackFeatureName } from '@suite/experimental';
import { type FlagsRootState, selectFlags } from '@suite/flags';
import { selectMetadata, selectMetadataError } from '@suite/metadata';
import { type SuiteSettingsRootState, selectSuiteSettings } from '@suite/settings';
import { type DesktopSuiteSyncRootState, selectSuiteSync } from '@suite/suite-sync';
import { type AnalyticsRootState, selectAnalytics } from '@suite-common/analytics-redux';
import { type WithBluetoothState, selectKnownDevices } from '@suite-common/bluetooth';
import {
    type ConnectPopupStateRootState,
    selectConnectAppPermissions,
} from '@suite-common/connect-popup';
import {
    type DeviceRootState,
    deviceActions,
    selectDevices,
    selectPersistentDeviceData,
} from '@suite-common/device';
import { type DiscreetModeRootState, selectDiscreetMode } from '@suite-common/discreet-mode';
import { type FeatureFeedbackRootState, selectFeatureFeedback } from '@suite-common/feedback';
import { type FirmwareRootState, selectFirmwareChannel } from '@suite-common/firmware';
import { type MessageSystemRootState, selectMessageSystem } from '@suite-common/message-system';
import { type MetadataState } from '@suite-common/metadata-types';
import { type EncryptedHex } from '@suite-common/platform-encryption';
import { type ReceiveRootState, selectReceiveAccountState } from '@suite-common/receive';
import { createThunk } from '@suite-common/redux-utils/';
import {
    type WithSuiteSyncQuotaManagerState,
    selectSuiteSyncQuotaManager,
} from '@suite-common/suite-sync-quota-manager';
import { type SuiteSyncOwnerSerialized } from '@suite-common/suite-sync-storage';
import { isDeviceAcquired } from '@suite-common/suite-utils';
import { type ThpRootState, selectThp } from '@suite-common/thp';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type DefinitionType,
    type TokenDefinitionsRootState,
    type TokenManagementAction,
    selectTokenDefinitions,
} from '@suite-common/token-definitions';
import type { TradingTransaction } from '@suite-common/trading';
import type { Explorer, NetworkSymbol } from '@suite-common/wallet-config';
import { FormDraftPrefixKeyValues } from '@suite-common/wallet-constants';
import {
    type AccountsRootState,
    type BlockchainRootState,
    type FiatRatesRootState,
    type FormDraftRootState,
    type PhishingRootState,
    type PhishingState,
    type SendRootState,
    type StellarContractTokensRootState,
    type TransactionsRootState,
    type WalletSettingsRootState,
    selectAccounts,
    selectBlockchainState,
    selectFormDraft,
    selectHistoricFiatRates,
    selectPhishing,
    selectPhishingTransactions,
    selectSendFormDrafts,
    selectTransactions,
    selectWalletSettings,
    selectStellarContractTokens,
} from '@suite-common/wallet-core';
import type {
    AccountKey,
    FormDraftKeyPrefix,
    FormState,
    RatesByTimestamps,
    SuccessfulAccount,
} from '@suite-common/wallet-types';
import {
    getFormDraftKey,
    isAccountSuccessful,
    selectHistoricRatesByTransactions,
} from '@suite-common/wallet-utils';
import { type WalletConnectStateRootState, selectSessions } from '@suite-common/walletconnect';
import { type StaticSessionId } from '@trezor/connect';
import { parseStaticSessionId } from '@trezor/device-utils';
import { cloneObject, isNotNullOrUndefined, typedObjectKeys } from '@trezor/utils';

import {
    type storageCorrupted,
    type storageError,
    type storageLoad,
} from 'src/actions/suite/storageLifecycleActions';
import { type SuiteState } from 'src/reducers/suite/suiteReducer';
import { type GraphState } from 'src/reducers/wallet/graphReducer';
import { selectGraph } from 'src/reducers/wallet/graphReducer';
import {
    selectEvmSettings,
    selectSeenDisconnectNotificationForDeviceIds,
} from 'src/selectors/suite/suiteSelectors';
import { db } from 'src/storage';
import type { TrezorDevice } from 'src/types/suite';
import type { Account } from 'src/types/wallet';
import { type GraphData } from 'src/types/wallet/graph';
import { serializeCoinjoinAccount, serializeDevice } from 'src/utils/suite/storage';
import { deviceGraphDataFilterFn } from 'src/utils/wallet/graph';

import { STORAGE } from './constants';
import { type DesktopBluetoothDevice } from '../bluetooth/DesktopBluetoothDevice';

export type StorageAction = ReturnType<
    typeof storageLoad | typeof storageError | typeof storageCorrupted
>;
export type StorageLoadAction = ReturnType<typeof storageLoad>;

export const saveExplorer = ({
    symbol,
    explorer,
}: {
    symbol: NetworkSymbol;
    explorer?: Explorer;
}) => {
    if (!db.isAccessible()) return;

    db.removeItemByPK('explorer', symbol);

    if (explorer !== undefined) {
        return db.addItem('explorer', { symbol, explorer }, symbol);
    }
};

export const saveDraft = (formState: FormState, accountKey: AccountKey) => {
    if (!db.isAccessible()) return;

    return db.addItem('sendFormDrafts', formState, accountKey, true);
};

export const removeDraft = (accountKey: AccountKey) => {
    if (!db.isAccessible()) return;

    return db.removeItemByPK('sendFormDrafts', accountKey);
};

type SaveAccountDraftThunkState = SendRootState;

export const saveAccountDraftThunk =
    (account: Account) =>
    (_: Dispatch<UnknownAction>, getState: () => SaveAccountDraftThunkState) => {
        if (!db.isAccessible()) return;
        const drafts = selectSendFormDrafts(getState());
        const draft = drafts[account.key];
        if (draft) {
            return db.addItem('sendFormDrafts', draft, account.key, true);
        }
    };

type SaveAccountReceiveThunkState = ReceiveRootState;

export const saveAccountReceiveThunk =
    (accountKey: AccountKey) =>
    (_: Dispatch<UnknownAction>, getState: () => SaveAccountReceiveThunkState) => {
        if (!db.isAccessible()) return;

        const receiveAccount = selectReceiveAccountState(getState(), accountKey);

        return receiveAccount ? db.addItem('receive', receiveAccount, accountKey, true) : undefined;
    };

const removeAccountDraft = (account: Account) => {
    if (!db.isAccessible()) return Promise.resolve();

    return db.removeItemByPK('sendFormDrafts', account.key);
};

type SaveCoinjoinAccountThunkState = CoinjoinRootState;

export const saveCoinjoinAccountThunk =
    (accountKey: AccountKey) =>
    (_: Dispatch<UnknownAction>, getState: () => SaveCoinjoinAccountThunkState) => {
        const coinjoinAccount = selectCoinjoinAccountByKey(getState(), accountKey);
        if (!coinjoinAccount || !db.isAccessible()) return;
        const serializedAccount = serializeCoinjoinAccount(coinjoinAccount);

        return db.addItem('coinjoinAccounts', serializedAccount, accountKey, true);
    };

type RemoveCoinjoinRelatedSettingState = FlagsRootState &
    SuiteSettingsRootState & {
        suite: Pick<SuiteState, 'evmSettings' | 'seenDisconnectNotificationForDeviceIds'>;
    };

const removeCoinjoinRelatedSetting = (state: RemoveCoinjoinRelatedSettingState) => {
    const settings = { ...selectSuiteSettings(state) };

    settings.isCoinjoinReceiveWarningHidden = false;

    db.addItem(
        'suiteSettings',
        {
            settings,
            flags: state.flags,
            evmSettings: state.suite.evmSettings,
            seenDisconnectNotificationForDeviceIds:
                state.suite.seenDisconnectNotificationForDeviceIds,
        },
        'suite',
        true,
    );
};

type RemoveCoinjoinAccountState = FlagsRootState &
    SuiteSettingsRootState & {
        suite: Pick<SuiteState, 'evmSettings' | 'seenDisconnectNotificationForDeviceIds'>;
    };

export const removeCoinjoinAccount = async (
    accountKey: AccountKey,
    state: RemoveCoinjoinAccountState,
) => {
    if (!db.isAccessible()) return;

    await db.removeItemByPK('coinjoinAccounts', accountKey);

    const savedCoinjoinAccounts = await db.getItemsExtended('coinjoinAccounts');
    if (!savedCoinjoinAccounts.length) {
        removeCoinjoinRelatedSetting(state);
    }
};

type SaveCoinjoinDebugSettingsThunkState = CoinjoinRootState;

export const saveCoinjoinDebugSettingsThunk =
    () =>
    (_dispatch: Dispatch<UnknownAction>, getState: () => SaveCoinjoinDebugSettingsThunkState) => {
        if (!db.isAccessible()) return;
        const debug = selectCoinjoinDebug(getState());
        db.addItem('coinjoinDebugSettings', debug || {}, 'debug', true);
    };

type SaveThpCredentialsThunkState = ThpRootState;

export const saveThpCredentialsThunk = createThunk<
    void,
    void,
    { state: SaveThpCredentialsThunkState }
>(`${STORAGE.MODULE_PREFIX}/saveThpCredentials`, async (_, { getState }) => {
    if (!db.isAccessible()) return;
    const { credentials } = selectThp(getState());
    await db.addItem('thp', { credentials }, 'value', true);
});

type SaveKnownDevicesThunkState = WithBluetoothState<DesktopBluetoothDevice>;

export const saveKnownDevicesThunk = createThunk<void, void, { state: SaveKnownDevicesThunkState }>(
    `${STORAGE.MODULE_PREFIX}/saveKnownDevices`,
    async (_, { getState }) => {
        if (!db.isAccessible()) return;
        const knownDevices = selectKnownDevices<DesktopBluetoothDevice>(getState());

        await db.addItem(
            'bluetooth',
            {
                knownDevices: knownDevices.map((it): DesktopBluetoothDevice => ({
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
                })),
            },
            'value',
            true,
        );
    },
);

type SaveAccountFormDraftThunkState = FormDraftRootState;

export const saveAccountFormDraftThunk =
    (prefix: FormDraftKeyPrefix, accountKey: string) =>
    (_: Dispatch<UnknownAction>, getState: () => SaveAccountFormDraftThunkState) => {
        if (!db.isAccessible()) return;

        const formDraftKey = getFormDraftKey(prefix, accountKey);
        const formDraft = selectFormDraft(getState(), formDraftKey);

        return formDraft ? db.addItem('formDrafts', formDraft, formDraftKey, true) : undefined;
    };

const removeAccountFormDraft = (prefix: FormDraftKeyPrefix, accountKey: string) => {
    if (!db.isAccessible()) return;

    return db.removeItemByPK('formDrafts', getFormDraftKey(prefix, accountKey));
};

export const saveDevice = (device: TrezorDevice) => {
    if (!db.isAccessible()) return;
    if (!isDeviceAcquired(device) || !device.state?.staticSessionId) return;

    return db.addItem('devices', serializeDevice(device), device.state.staticSessionId, true);
};

const removeAccount = (account: Account) => {
    if (!db.isAccessible()) return;

    return db.removeItemByPK('accounts', [account.descriptor, account.symbol, account.deviceState]);
};

export const removeAccountTransactions = async (account: Account) => {
    if (!db.isAccessible()) return;
    await db.removeItemByIndex('txs', 'accountKey', [
        account.descriptor,
        account.symbol,
        account.deviceState,
    ]);
};

const removeAccountGraph = (account: Account) => {
    if (!db.isAccessible()) return;

    return db.removeItemByIndex('graph', 'accountKey', [
        account.descriptor,
        account.symbol,
        account.deviceState,
    ]);
};

export const removeAccountHistoricRates = (accountKey: string) => {
    if (!db.isAccessible()) return;

    return db.removeItemByPK('historicRates', accountKey);
};

export const removeAccountPhishing = (accountKey: AccountKey) => {
    if (!db.isAccessible()) return;

    return db.removeItemByPK('phishing', accountKey);
};

export const removeAccountStellarContractTokens = (accountKey: AccountKey) => {
    if (!db.isAccessible()) return;

    return db.removeItemByPK('stellarContractTokens', accountKey);
};

type RemoveAccountWithDependenciesState = FlagsRootState &
    SuiteSettingsRootState & {
        suite: Pick<SuiteState, 'evmSettings' | 'seenDisconnectNotificationForDeviceIds'>;
    };

export const removeAccountWithDependencies =
    (getState: () => RemoveAccountWithDependenciesState) => (account: Account) =>
        Promise.all([
            ...FormDraftPrefixKeyValues.map(prefix => removeAccountFormDraft(prefix, account.key)),
            removeAccountDraft(account),
            db.removeItemByPK('receive', account.key),
            removeAccountTransactions(account),
            removeAccountGraph(account),
            removeCoinjoinAccount(account.key, getState()),
            removeAccount(account),
            removeAccountHistoricRates(account.key),
            removeAccountPhishing(account.key),
            removeAccountStellarContractTokens(account.key),
        ]);

type ForgetDeviceThunkState = AccountsRootState &
    RemoveAccountWithDependenciesState & { metadata: MetadataState };

export const forgetDeviceThunk =
    (device: TrezorDevice) =>
    (_: Dispatch<UnknownAction>, getState: () => ForgetDeviceThunkState) => {
        if (!db.isAccessible()) return;
        if (!device.state?.staticSessionId) return;
        const { staticSessionId } = device.state;

        const accounts = selectAccounts(getState()).filter(a => a.deviceState === staticSessionId);

        // forget device metadata stuff
        const metadata = selectMetadata(getState());
        const { walletDescriptor } = parseStaticSessionId(staticSessionId);

        const hasLegacyLabelsMigrated = cloneObject(metadata.hasLegacyLabelsMigrated);
        delete hasLegacyLabelsMigrated[walletDescriptor];

        const metadataError = metadata.error;
        const error = metadataError ? cloneObject(metadataError) : undefined;
        delete error?.[staticSessionId];

        return Promise.all([
            db.removeItemByPK('devices', staticSessionId),
            db.removeItemByPK('suiteSyncOwners', staticSessionId),
            db.removeItemByIndex('accounts', 'deviceState', staticSessionId),
            db.removeItemByIndex('txs', 'deviceState', staticSessionId),
            db.removeItemByIndex('graph', 'deviceState', staticSessionId),
            ...accounts.map(removeAccountWithDependencies(getState)),
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            saveMetadata({ error, hasLegacyLabelsMigrated }),
        ]);
    };

// The 'accounts' store keys records by these fields (its IndexedDB keyPath). `satisfies` ensures
// they stay valid account fields, so a rename/typo is a compile error here rather than at runtime.
const ACCOUNT_KEY_PATH_FIELDS = [
    'descriptor',
    'symbol',
    'deviceState',
] as const satisfies readonly (keyof SuccessfulAccount)[];

export const saveAccounts = async (accounts: SuccessfulAccount[]) => {
    if (!db.isAccessible()) return;

    try {
        return await db.addItems('accounts', accounts, true);
    } catch (error) {
        // IndexedDB throws an opaque "Evaluating the object store's key path did not yield a value"
        // DataError when a keyPath field is missing. Report only WHICH key fields are missing - never
        // their values (descriptor / deviceState etc. are sensitive and must not reach Sentry/logs).
        const missingKeyPathFields = ACCOUNT_KEY_PATH_FIELDS.filter(field =>
            accounts.some(account => !account[field]),
        );

        throw new Error(
            missingKeyPathFields.length
                ? `Cannot save account(s) to storage, missing keyPath field(s): ${missingKeyPathFields.join(', ')}`
                : `Cannot save account(s) to storage: ${error?.message ?? ''}`,
            { cause: error },
        );
    }
};

export const saveTradingTrade = (trade: TradingTransaction) => {
    if (!db.isAccessible()) return;

    return db.addItem('tradingTrades', trade, undefined, true);
};

export const saveGraph = (graphData: GraphData[]) => {
    if (!db.isAccessible()) return;

    return db.addItems('graph', graphData, true);
};

type SaveAccountHistoricRatesThunkState = TransactionsRootState;

export const saveAccountHistoricRatesThunk =
    (accountKey: AccountKey, historicRates: RatesByTimestamps) =>
    (_dispatch: Dispatch<UnknownAction>, getState: () => SaveAccountHistoricRatesThunkState) => {
        if (!db.isAccessible()) return Promise.resolve();
        const allTxs = selectTransactions(getState());
        const accTxs = (allTxs[accountKey] || []).filter(isNotNullOrUndefined);

        const accHistoricRates = selectHistoricRatesByTransactions(historicRates, accTxs);

        return db.addItem('historicRates', accHistoricRates, accountKey, true);
    };

type SaveAccountTransactionsThunkState = TransactionsRootState;

export const saveAccountTransactionsThunk =
    (account: Account) =>
    (_dispatch: Dispatch<UnknownAction>, getState: () => SaveAccountTransactionsThunkState) => {
        if (!db.isAccessible()) return Promise.resolve();
        const transactions = selectTransactions(getState());
        const phishing = selectPhishingTransactions(getState());
        const accTxs = transactions[account.key] || [];

        // wrap txs and add its order inside the array
        const orderedTxs = accTxs.map((tx, order) => ({ tx, order })).filter(({ tx }) => !!tx);
        const transactionsPromise = db.addItems('txs', orderedTxs, true);

        const phishingList = phishing[account.key] ?? [];
        const phishingPromise =
            phishingList.length > 0
                ? db.addItem('phishing', phishingList, account.key, true)
                : db.removeItemByPK('phishing', account.key);

        return Promise.all([transactionsPromise, phishingPromise]);
    };

type SavePhishingMetadataThunkState = PhishingRootState;

export const savePhishingMetadataThunk =
    (phishingMetadata: Partial<PhishingState>) =>
    (_dispatch: Dispatch<UnknownAction>, getState: () => SavePhishingMetadataThunkState) => {
        if (!db.isAccessible()) return;
        const oldState = selectPhishing(getState());
        const newState = { ...oldState, ...phishingMetadata };

        return db.addItem('phishingMetadata', newState, 'phishingMetadata', true);
    };

type RememberDeviceThunkState = AccountsRootState &
    CoinjoinRootState &
    FiatRatesRootState &
    FormDraftRootState &
    ReceiveRootState &
    SendRootState &
    TransactionsRootState & {
        metadata: MetadataState;
        wallet: { graph: GraphState };
    };

export const rememberDeviceThunk =
    (device: TrezorDevice) =>
    async (
        dispatch: ThunkDispatch<RememberDeviceThunkState, unknown, UnknownAction>,
        getState: () => RememberDeviceThunkState,
    ) => {
        if (!db.isAccessible()) return;
        if (!isDeviceAcquired(device) || !device.state?.staticSessionId) return;

        const accounts = selectAccounts(getState())
            .filter(isAccountSuccessful)
            .filter(a => a.deviceState === device.state?.staticSessionId);

        const graphData = selectGraph(getState()).data.filter(d =>
            deviceGraphDataFilterFn(d, device.state?.staticSessionId),
        );
        const historicRates = selectHistoricFiatRates(getState());

        const accountPromises = accounts.reduce<Array<unknown | Promise<unknown>>>(
            (promises, account) =>
                promises.concat(
                    [
                        dispatch(saveAccountReceiveThunk(account.key)),
                        dispatch(saveAccountTransactionsThunk(account)),
                        dispatch(saveAccountDraftThunk(account)),
                        dispatch(saveCoinjoinAccountThunk(account.key)),
                        dispatch(saveAccountHistoricRatesThunk(account.key, historicRates)),
                    ],
                    FormDraftPrefixKeyValues.map(prefix =>
                        dispatch(saveAccountFormDraftThunk(prefix, account.key)),
                    ),
                ),
            [],
        );

        try {
            await Promise.all([
                saveDevice(device),
                saveAccounts(accounts),
                saveGraph(graphData),
                // eslint-disable-next-line  @typescript-eslint/no-use-before-define
                dispatch(saveDeviceMetadataErrorThunk(device)),
                ...accountPromises,
            ]);
        } catch (error) {
            console.error('Remember device:', error);
        }
    };

type SaveWalletSettingsThunkState = WalletSettingsRootState;

export const saveWalletSettingsThunk =
    () =>
    async (_dispatch: Dispatch<UnknownAction>, getState: () => SaveWalletSettingsThunkState) => {
        if (!db.isAccessible()) return;
        await db.addItem(
            'walletSettings',
            {
                ...selectWalletSettings(getState()),
            },
            'wallet',
            true,
        );
    };

type SaveDiscreetModeThunkState = DiscreetModeRootState;

export const saveDiscreetModeThunk =
    () =>
    async (_dispatch: Dispatch<UnknownAction>, getState: () => SaveDiscreetModeThunkState) => {
        if (!db.isAccessible()) return;
        await db.addItem('discreetMode', selectDiscreetMode(getState()), 'discreetMode', true);
    };

type SaveBackendThunkState = BlockchainRootState;

export const saveBackendThunk =
    (symbol: NetworkSymbol) =>
    async (_dispatch: Dispatch<UnknownAction>, getState: () => SaveBackendThunkState) => {
        if (!db.isAccessible()) return;
        await db.addItem(
            'backendSettings',
            selectBlockchainState(getState())[symbol].backends,
            symbol,
            true,
        );
    };

type SaveSuiteSettingsThunkState = FlagsRootState &
    SuiteSettingsRootState & {
        suite: Pick<SuiteState, 'evmSettings' | 'seenDisconnectNotificationForDeviceIds'>;
    };

export const saveSuiteSettingsThunk =
    () =>
    (
        _dispatch: Dispatch<UnknownAction>,
        getState: () => SaveSuiteSettingsThunkState,
    ): Promise<void> => {
        if (!db.isAccessible()) return Promise.resolve();
        const suiteSettings = selectSuiteSettings(getState());
        const flags = selectFlags(getState());
        const evmSettings = selectEvmSettings(getState());
        const seenDisconnectNotificationForDeviceIds =
            selectSeenDisconnectNotificationForDeviceIds(getState());

        const result = db.addItem(
            'suiteSettings',
            {
                settings: {
                    ...suiteSettings,
                    // Temporary measure to always start Suite with password manager off
                    experimental: suiteSettings.experimental?.filter(e => e !== 'password-manager'),
                },
                flags,
                evmSettings,
                seenDisconnectNotificationForDeviceIds,
            },
            'suite',
            true,
        );

        return result.then(() => {});
    };

type SaveDebugSettingsThunkState = DebugRootState;

export const saveDebugSettingsThunk =
    () =>
    async (_dispatch: Dispatch<UnknownAction>, getState: () => SaveDebugSettingsThunkState) => {
        if (!db.isAccessible()) return;
        await db.addItem('debug', selectDebug(getState()), 'debug', true);
    };

type SaveStellarContractTokensThunkState = StellarContractTokensRootState;

export const saveStellarContractTokens =
    (accountKey: AccountKey) =>
    (_dispatch: Dispatch<UnknownAction>, getState: () => SaveStellarContractTokensThunkState) => {
        if (!db.isAccessible()) return;

        const contracts = selectStellarContractTokens(getState(), accountKey);

        return contracts.length > 0
            ? db.addItem('stellarContractTokens', contracts, accountKey, true)
            : db.removeItemByPK('stellarContractTokens', accountKey);
    };

type SaveTokenManagementThunkState = TokenDefinitionsRootState;

export const saveTokenManagementThunk =
    (symbol: NetworkSymbol, type: DefinitionType, status: TokenManagementAction) =>
    async (_dispatch: Dispatch<UnknownAction>, getState: () => SaveTokenManagementThunkState) => {
        if (!db.isAccessible()) return;
        const tokenDefinitions = selectTokenDefinitions(getState());
        const tokenDefinitionsType = tokenDefinitions[symbol]?.[type];
        const data = tokenDefinitionsType?.[status];

        const key = `${symbol}-${type}-${status}`;

        await db.removeItemByPK('tokenManagement', key);

        return data ? db.addItem('tokenManagement', data, key, true) : undefined;
    };

type SaveAnalyticsThunkState = AnalyticsRootState;

export const saveAnalyticsThunk =
    () => (_dispatch: Dispatch<UnknownAction>, getState: () => SaveAnalyticsThunkState) => {
        if (!db.isAccessible()) return;

        const analytics = selectAnalytics(getState());
        db.addItem(
            'analytics',
            {
                enabled: analytics.enabled,
                instanceId: analytics.instanceId,
                confirmed: analytics.confirmed,
                customAnalyticsUrl: analytics.customAnalyticsUrl,
                loggerEnabled: analytics.loggerEnabled,
            },
            'suite',
            true,
        );
    };

type MetadataPersistentKeys =
    'providers' | 'enabled' | 'selectedProvider' | 'error' | 'hasLegacyLabelsMigrated';

const saveMetadata = async (metadata: Partial<Pick<MetadataState, MetadataPersistentKeys>>) => {
    if (!db.isAccessible()) return;

    // remove undefined in metadata arg
    typedObjectKeys(metadata).forEach(key => {
        if (typeof metadata[key] === 'undefined') {
            delete metadata[key];
        }
    });
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
type SaveMetadataSettingsThunkState = { metadata: MetadataState };

export const saveMetadataSettingsThunk =
    () =>
    async (_dispatch: Dispatch<UnknownAction>, getState: () => SaveMetadataSettingsThunkState) => {
        // for some strage race-condition reason it has to be awaited, so that the getState runs async
        if (!(await db.isAccessible())) return;

        const metadata = selectMetadata(getState());

        await saveMetadata({
            providers: metadata.providers,
            enabled: metadata.enabled,
            selectedProvider: metadata.selectedProvider,
            hasLegacyLabelsMigrated: metadata.hasLegacyLabelsMigrated,
        });
    };

type SaveSuiteSyncSettingsThunkState = DesktopSuiteSyncRootState;

export const saveSuiteSyncSettingsThunk =
    () => (_dispatch: Dispatch<UnknownAction>, getState: () => SaveSuiteSyncSettingsThunkState) => {
        if (!db.isAccessible()) return;

        const suiteSync = selectSuiteSync(getState());

        return db.addItem(
            'suiteSyncSettings',
            {
                isSuiteSyncEnabled: suiteSync.settings.isSuiteSyncEnabled,
                isSuiteSyncDebugEnabled: suiteSync.settings.isSuiteSyncDebugEnabled,
                suiteSyncRelayUrl: suiteSync.settings.suiteSyncRelayUrl,
                isUnsupportedDeviceBannerDismissed: suiteSync.isUnsupportedDeviceBannerDismissed,
            },
            'suiteSyncSettings',
            true,
        );
    };

type SaveSuiteSyncOwnerParams = {
    deviceStaticId: StaticSessionId;
    owner: EncryptedHex<SuiteSyncOwnerSerialized> | null;
};

export const saveSuiteSyncOwner =
    ({ deviceStaticId, owner }: SaveSuiteSyncOwnerParams) =>
    () => {
        if (!db.isAccessible()) return;

        if (owner === null) {
            return db.removeItemByPK('suiteSyncOwners', deviceStaticId);
        }

        return db.addItem('suiteSyncOwners', owner, deviceStaticId, true);
    };

type SaveSuiteSyncQuotaManagerThunkState = WithSuiteSyncQuotaManagerState;

export const saveSuiteSyncQuotaManagerThunk =
    () =>
    (_dispatch: Dispatch<UnknownAction>, getState: () => SaveSuiteSyncQuotaManagerThunkState) => {
        if (!db.isAccessible()) return;

        const suiteSyncQuotaManager = selectSuiteSyncQuotaManager(getState());

        return db.addItem(
            'suiteSyncQuotaManager',
            {
                baseUrl: suiteSyncQuotaManager.baseUrl,
                enforceQuotaManager: suiteSyncQuotaManager.enforceQuotaManager,
                registeredDevices: suiteSyncQuotaManager.registeredDevices,
                ownersAllowance: suiteSyncQuotaManager.ownersAllowance,
            },
            'suiteSyncQuotaManager',
            true,
        );
    };

type SaveDeviceMetadataErrorThunkState = { metadata: MetadataState };

export const saveDeviceMetadataErrorThunk =
    (device: TrezorDevice) =>
    async (
        _dispatch: Dispatch<UnknownAction>,
        getState: () => SaveDeviceMetadataErrorThunkState,
    ) => {
        if (!db.isAccessible()) return;

        const error = selectMetadataError(getState());
        if (device.state?.staticSessionId && error?.[device.state.staticSessionId]) {
            await saveMetadata({ error });
        }
    };

type SaveMessageSystemThunkState = MessageSystemRootState;

export const saveMessageSystemThunk =
    () => (_dispatch: Dispatch<UnknownAction>, getState: () => SaveMessageSystemThunkState) => {
        if (!db.isAccessible()) return;

        const {
            dismissedMessages,
            config,
            currentSequence,
            configSource,
            manuallyAddedMessageIds,
            manuallyAddedExperimentIds,
        } = selectMessageSystem(getState());

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

type SavePersistentDeviceDataThunkState = DeviceRootState;

export const savePersistentDeviceDataThunk =
    () =>
    async (
        _dispatch: Dispatch<UnknownAction>,
        getState: () => SavePersistentDeviceDataThunkState,
    ) => {
        if (!db.isAccessible()) return;
        const data = selectPersistentDeviceData(getState());

        await db.addItem('persistentDeviceData', data, 'persistentDeviceData', true);
    };

type SaveConnectSettingsThunkState = ConnectPopupStateRootState & WalletConnectStateRootState;

export const saveConnectSettingsThunk =
    () => (_dispatch: Dispatch<UnknownAction>, getState: () => SaveConnectSettingsThunkState) => {
        if (!db.isAccessible()) return;
        const permissions = selectConnectAppPermissions(getState());
        const walletConnectSessions = selectSessions(getState());

        db.addItem(
            'connect',
            {
                permissions,
                walletConnectSessions,
            },
            'connect',
            true,
        );
    };

type SaveFirmwareSettingsThunkState = FirmwareRootState;

export const saveFirmwareSettingsThunk =
    () => (_dispatch: Dispatch<UnknownAction>, getState: () => SaveFirmwareSettingsThunkState) => {
        if (!db.isAccessible()) return;
        const firmwareChannel = selectFirmwareChannel(getState());

        db.addItem(
            'firmware',
            {
                firmwareChannel,
            },
            'firmware',
            true,
        );
    };

type SaveFeatureFeedbackThunkState = FeatureFeedbackRootState<FeedbackFeatureName>;

export const saveFeatureFeedbackThunk =
    () => (_dispatch: Dispatch<UnknownAction>, getState: () => SaveFeatureFeedbackThunkState) => {
        if (!db.isAccessible()) return;
        const featureFeedback = selectFeatureFeedback(getState());

        return db.addItem('featureFeedback', featureFeedback, 'featureFeedback', true);
    };

type RemoveDatabaseThunkState = DeviceRootState;

export const removeDatabaseThunk =
    () => async (dispatch: Dispatch<UnknownAction>, getState: () => RemoveDatabaseThunkState) => {
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
