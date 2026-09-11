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
import { type WithServices, createThunk } from '@suite-common/redux-utils/';
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
    type EarnOnboardingRootState,
    type FiatRatesRootState,
    type FormDraftRootState,
    type PhishingRootState,
    type PhishingState,
    type SendRootState,
    type TransactionsRootState,
    type WalletSettingsRootState,
    selectAccounts,
    selectBlockchainState,
    selectConfirmedEarnOpportunities,
    selectFormDraft,
    selectHistoricFiatRates,
    selectPhishing,
    selectPhishingTransactions,
    selectSendFormDrafts,
    selectTransactions,
    selectWalletSettings,
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

import { type SuiteState } from 'src/reducers/suite/suiteReducer';
import { type GraphState } from 'src/reducers/wallet/graphReducer';
import { selectGraph } from 'src/reducers/wallet/graphReducer';
import {
    selectEvmSettings,
    selectSeenDisconnectNotificationForDeviceIds,
} from 'src/selectors/suite/suiteSelectors';
import { type DbDep } from 'src/storage/createDb';
import type { TrezorDevice } from 'src/types/suite';
import type { Account } from 'src/types/wallet';
import { type GraphData } from 'src/types/wallet/graph';
import { serializeCoinjoinAccount, serializeDevice } from 'src/utils/suite/storage';
import { deviceGraphDataFilterFn } from 'src/utils/wallet/graph';

import { STORAGE } from './constants';
import { type DesktopBluetoothDevice } from '../bluetooth/DesktopBluetoothDevice';

export const saveExplorer = (
    deps: DbDep,
    {
        symbol,
        explorer,
    }: {
        symbol: NetworkSymbol;
        explorer?: Explorer;
    },
) => {
    if (!deps.db.isAccessible()) return;

    deps.db.removeItemByPK('explorer', symbol);

    if (explorer !== undefined) {
        return deps.db.addItem('explorer', { symbol, explorer }, symbol);
    }
};

export const saveDraft = (deps: DbDep, formState: FormState, accountKey: AccountKey) => {
    if (!deps.db.isAccessible()) return;

    return deps.db.addItem('sendFormDrafts', formState, accountKey, true);
};

export const removeDraft = (deps: DbDep, accountKey: AccountKey) => {
    if (!deps.db.isAccessible()) return;

    return deps.db.removeItemByPK('sendFormDrafts', accountKey);
};

type SaveAccountDraftThunkState = SendRootState;

type SaveAccountDraftThunkDeps = WithServices<DbDep>;

export const saveAccountDraftThunk =
    (account: Account) =>
    (
        _: Dispatch<UnknownAction>,
        getState: () => SaveAccountDraftThunkState,
        extra: SaveAccountDraftThunkDeps,
    ) => {
        if (!extra.services.db.isAccessible()) return;
        const drafts = selectSendFormDrafts(getState());
        const draft = drafts[account.key];
        if (draft) {
            return extra.services.db.addItem('sendFormDrafts', draft, account.key, true);
        }
    };

type SaveAccountReceiveThunkState = ReceiveRootState;

type SaveAccountReceiveThunkDeps = WithServices<DbDep>;

export const saveAccountReceiveThunk =
    (accountKey: AccountKey) =>
    (
        _: Dispatch<UnknownAction>,
        getState: () => SaveAccountReceiveThunkState,
        extra: SaveAccountReceiveThunkDeps,
    ) => {
        if (!extra.services.db.isAccessible()) return;

        const receiveAccount = selectReceiveAccountState(getState(), accountKey);

        return receiveAccount
            ? extra.services.db.addItem('receive', receiveAccount, accountKey, true)
            : undefined;
    };

type SaveEarnOnboardingThunkState = EarnOnboardingRootState;

type SaveEarnOnboardingThunkDeps = WithServices<DbDep>;

export const saveEarnOnboardingThunk =
    (accountKey: AccountKey) =>
    (
        _: Dispatch<UnknownAction>,
        getState: () => SaveEarnOnboardingThunkState,
        extra: SaveEarnOnboardingThunkDeps,
    ) => {
        if (!extra.services.db.isAccessible()) return;

        const confirmedOpportunities = selectConfirmedEarnOpportunities(getState(), accountKey);

        return confirmedOpportunities
            ? extra.services.db.addItem('earnOnboarding', confirmedOpportunities, accountKey, true)
            : undefined;
    };

const removeEarnOnboarding = (deps: DbDep, accountKey: AccountKey) => {
    if (!deps.db.isAccessible()) return Promise.resolve();

    return deps.db.removeItemByPK('earnOnboarding', accountKey);
};

const removeAccountDraft = (deps: DbDep, account: Account) => {
    if (!deps.db.isAccessible()) return Promise.resolve();

    return deps.db.removeItemByPK('sendFormDrafts', account.key);
};

type SaveCoinjoinAccountThunkState = CoinjoinRootState;

type SaveCoinjoinAccountThunkDeps = WithServices<DbDep>;

export const saveCoinjoinAccountThunk =
    (accountKey: AccountKey) =>
    (
        _: Dispatch<UnknownAction>,
        getState: () => SaveCoinjoinAccountThunkState,
        extra: SaveCoinjoinAccountThunkDeps,
    ) => {
        const coinjoinAccount = selectCoinjoinAccountByKey(getState(), accountKey);
        if (!coinjoinAccount || !extra.services.db.isAccessible()) return;
        const serializedAccount = serializeCoinjoinAccount(coinjoinAccount);

        return extra.services.db.addItem('coinjoinAccounts', serializedAccount, accountKey, true);
    };

type RemoveCoinjoinRelatedSettingState = FlagsRootState &
    SuiteSettingsRootState & {
        suite: Pick<SuiteState, 'evmSettings' | 'seenDisconnectNotificationForDeviceIds'>;
    };

const removeCoinjoinRelatedSetting = (deps: DbDep, state: RemoveCoinjoinRelatedSettingState) => {
    const settings = { ...selectSuiteSettings(state) };

    settings.isCoinjoinReceiveWarningHidden = false;

    deps.db.addItem(
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
    deps: DbDep,
    accountKey: AccountKey,
    state: RemoveCoinjoinAccountState,
) => {
    if (!deps.db.isAccessible()) return;

    await deps.db.removeItemByPK('coinjoinAccounts', accountKey);

    const savedCoinjoinAccounts = await deps.db.getItemsExtended('coinjoinAccounts');
    if (!savedCoinjoinAccounts.length) {
        removeCoinjoinRelatedSetting(deps, state);
    }
};

type SaveCoinjoinDebugSettingsThunkState = CoinjoinRootState;

type SaveCoinjoinDebugSettingsThunkDeps = WithServices<DbDep>;

export const saveCoinjoinDebugSettingsThunk =
    () =>
    (
        _dispatch: Dispatch<UnknownAction>,
        getState: () => SaveCoinjoinDebugSettingsThunkState,
        extra: SaveCoinjoinDebugSettingsThunkDeps,
    ) => {
        if (!extra.services.db.isAccessible()) return;
        const debug = selectCoinjoinDebug(getState());
        extra.services.db.addItem('coinjoinDebugSettings', debug || {}, 'debug', true);
    };

type SaveThpCredentialsThunkState = ThpRootState;

type SaveThpCredentialsThunkDeps = WithServices<DbDep>;

export const saveThpCredentialsThunk = createThunk<
    void,
    void,
    { state: SaveThpCredentialsThunkState; extra: SaveThpCredentialsThunkDeps }
>(`${STORAGE.MODULE_PREFIX}/saveThpCredentials`, async (_, { getState, extra }) => {
    if (!extra.services.db.isAccessible()) return;
    const { credentials } = selectThp(getState());
    await extra.services.db.addItem('thp', { credentials }, 'value', true);
});

type SaveKnownDevicesThunkState = WithBluetoothState<DesktopBluetoothDevice>;

type SaveKnownDevicesThunkDeps = WithServices<DbDep>;

export const saveKnownDevicesThunk = createThunk<
    void,
    void,
    { state: SaveKnownDevicesThunkState; extra: SaveKnownDevicesThunkDeps }
>(`${STORAGE.MODULE_PREFIX}/saveKnownDevices`, async (_, { getState, extra }) => {
    if (!extra.services.db.isAccessible()) return;
    const knownDevices = selectKnownDevices<DesktopBluetoothDevice>(getState());

    await extra.services.db.addItem(
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
});

type SaveAccountFormDraftThunkState = FormDraftRootState;

type SaveAccountFormDraftThunkDeps = WithServices<DbDep>;

export const saveAccountFormDraftThunk =
    (prefix: FormDraftKeyPrefix, accountKey: string) =>
    (
        _: Dispatch<UnknownAction>,
        getState: () => SaveAccountFormDraftThunkState,
        extra: SaveAccountFormDraftThunkDeps,
    ) => {
        if (!extra.services.db.isAccessible()) return;

        const formDraftKey = getFormDraftKey(prefix, accountKey);
        const formDraft = selectFormDraft(getState(), formDraftKey);

        return formDraft
            ? extra.services.db.addItem('formDrafts', formDraft, formDraftKey, true)
            : undefined;
    };

const removeAccountFormDraft = (deps: DbDep, prefix: FormDraftKeyPrefix, accountKey: string) => {
    if (!deps.db.isAccessible()) return;

    return deps.db.removeItemByPK('formDrafts', getFormDraftKey(prefix, accountKey));
};

export const saveDevice = (deps: DbDep, device: TrezorDevice) => {
    if (!deps.db.isAccessible()) return;
    if (!isDeviceAcquired(device) || !device.state?.staticSessionId) return;

    return deps.db.addItem('devices', serializeDevice(device), device.state.staticSessionId, true);
};

const removeAccount = (deps: DbDep, account: Account) => {
    if (!deps.db.isAccessible()) return;

    return deps.db.removeItemByPK('accounts', [
        account.descriptor,
        account.symbol,
        account.deviceState,
    ]);
};

export const removeAccountTransactions = async (deps: DbDep, account: Account) => {
    if (!deps.db.isAccessible()) return;
    await deps.db.removeItemByIndex('txs', 'accountKey', [
        account.descriptor,
        account.symbol,
        account.deviceState,
    ]);
};

const removeAccountGraph = (deps: DbDep, account: Account) => {
    if (!deps.db.isAccessible()) return;

    return deps.db.removeItemByIndex('graph', 'accountKey', [
        account.descriptor,
        account.symbol,
        account.deviceState,
    ]);
};

export const removeAccountHistoricRates = (deps: DbDep, accountKey: string) => {
    if (!deps.db.isAccessible()) return;

    return deps.db.removeItemByPK('historicRates', accountKey);
};

export const removeAccountPhishing = (deps: DbDep, accountKey: AccountKey) => {
    if (!deps.db.isAccessible()) return;

    return deps.db.removeItemByPK('phishing', accountKey);
};

type RemoveAccountWithDependenciesState = FlagsRootState &
    SuiteSettingsRootState & {
        suite: Pick<SuiteState, 'evmSettings' | 'seenDisconnectNotificationForDeviceIds'>;
    };

type RemoveAccountWithDependenciesDeps = DbDep & {
    getState: () => RemoveAccountWithDependenciesState;
};

export const removeAccountWithDependencies =
    (deps: RemoveAccountWithDependenciesDeps) => (account: Account) =>
        Promise.all([
            ...FormDraftPrefixKeyValues.map(prefix =>
                removeAccountFormDraft(deps, prefix, account.key),
            ),
            removeAccountDraft(deps, account),
            deps.db.removeItemByPK('receive', account.key),
            removeAccountTransactions(deps, account),
            removeAccountGraph(deps, account),
            removeCoinjoinAccount(deps, account.key, deps.getState()),
            removeAccount(deps, account),
            removeAccountHistoricRates(deps, account.key),
            removeAccountPhishing(deps, account.key),
            removeEarnOnboarding(deps, account.key),
        ]);

type ForgetDeviceThunkState = AccountsRootState &
    RemoveAccountWithDependenciesState & { metadata: MetadataState };

type ForgetDeviceThunkDeps = WithServices<DbDep>;

export const forgetDeviceThunk =
    (device: TrezorDevice) =>
    (
        _: Dispatch<UnknownAction>,
        getState: () => ForgetDeviceThunkState,
        extra: ForgetDeviceThunkDeps,
    ) => {
        if (!extra.services.db.isAccessible()) return;
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
            extra.services.db.removeItemByPK('devices', staticSessionId),
            extra.services.db.removeItemByPK('suiteSyncOwners', staticSessionId),
            extra.services.db.removeItemByIndex('accounts', 'deviceState', staticSessionId),
            extra.services.db.removeItemByIndex('txs', 'deviceState', staticSessionId),
            extra.services.db.removeItemByIndex('graph', 'deviceState', staticSessionId),
            ...accounts.map(removeAccountWithDependencies({ db: extra.services.db, getState })),
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            saveMetadata(extra.services, { error, hasLegacyLabelsMigrated }),
        ]);
    };

// The 'accounts' store keys records by these fields (its IndexedDB keyPath). `satisfies` ensures
// they stay valid account fields, so a rename/typo is a compile error here rather than at runtime.
const ACCOUNT_KEY_PATH_FIELDS = [
    'descriptor',
    'symbol',
    'deviceState',
] as const satisfies readonly (keyof SuccessfulAccount)[];

export const saveAccounts = async (deps: DbDep, accounts: SuccessfulAccount[]) => {
    if (!deps.db.isAccessible()) return;

    try {
        return await deps.db.addItems('accounts', accounts, true);
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

export const saveTradingTrade = (deps: DbDep, trade: TradingTransaction) => {
    if (!deps.db.isAccessible()) return;

    return deps.db.addItem('tradingTrades', trade, undefined, true);
};

export const saveGraph = (deps: DbDep, graphData: GraphData[]) => {
    if (!deps.db.isAccessible()) return;

    return deps.db.addItems('graph', graphData, true);
};

type SaveAccountHistoricRatesThunkState = TransactionsRootState;

type SaveAccountHistoricRatesThunkDeps = WithServices<DbDep>;

export const saveAccountHistoricRatesThunk =
    (accountKey: AccountKey, historicRates: RatesByTimestamps) =>
    (
        _dispatch: Dispatch<UnknownAction>,
        getState: () => SaveAccountHistoricRatesThunkState,
        extra: SaveAccountHistoricRatesThunkDeps,
    ) => {
        if (!extra.services.db.isAccessible()) return Promise.resolve();
        const allTxs = selectTransactions(getState());
        const accTxs = (allTxs[accountKey] || []).filter(isNotNullOrUndefined);

        const accHistoricRates = selectHistoricRatesByTransactions(historicRates, accTxs);

        return extra.services.db.addItem('historicRates', accHistoricRates, accountKey, true);
    };

type SaveAccountTransactionsThunkState = TransactionsRootState;

type SaveAccountTransactionsThunkDeps = WithServices<DbDep>;

export const saveAccountTransactionsThunk =
    (account: Account) =>
    (
        _dispatch: Dispatch<UnknownAction>,
        getState: () => SaveAccountTransactionsThunkState,
        extra: SaveAccountTransactionsThunkDeps,
    ) => {
        if (!extra.services.db.isAccessible()) return Promise.resolve();
        const transactions = selectTransactions(getState());
        const phishing = selectPhishingTransactions(getState());
        const accTxs = transactions[account.key] || [];

        // wrap txs and add its order inside the array
        const orderedTxs = accTxs.map((tx, order) => ({ tx, order })).filter(({ tx }) => !!tx);
        const transactionsPromise = extra.services.db.addItems('txs', orderedTxs, true);

        const phishingList = phishing[account.key] ?? [];
        const phishingPromise =
            phishingList.length > 0
                ? extra.services.db.addItem('phishing', phishingList, account.key, true)
                : extra.services.db.removeItemByPK('phishing', account.key);

        return Promise.all([transactionsPromise, phishingPromise]);
    };

type SavePhishingMetadataThunkState = PhishingRootState;

type SavePhishingMetadataThunkDeps = WithServices<DbDep>;

export const savePhishingMetadataThunk =
    (phishingMetadata: Partial<PhishingState>) =>
    (
        _dispatch: Dispatch<UnknownAction>,
        getState: () => SavePhishingMetadataThunkState,
        extra: SavePhishingMetadataThunkDeps,
    ) => {
        if (!extra.services.db.isAccessible()) return;
        const oldState = selectPhishing(getState());
        const newState = { ...oldState, ...phishingMetadata };

        return extra.services.db.addItem('phishingMetadata', newState, 'phishingMetadata', true);
    };

type RememberDeviceThunkState = AccountsRootState &
    CoinjoinRootState &
    EarnOnboardingRootState &
    FiatRatesRootState &
    FormDraftRootState &
    ReceiveRootState &
    SendRootState &
    TransactionsRootState & {
        metadata: MetadataState;
        wallet: { graph: GraphState };
    };

type RememberDeviceThunkDeps = WithServices<DbDep>;

export const rememberDeviceThunk =
    (device: TrezorDevice) =>
    async (
        dispatch: ThunkDispatch<RememberDeviceThunkState, RememberDeviceThunkDeps, UnknownAction>,
        getState: () => RememberDeviceThunkState,
        extra: RememberDeviceThunkDeps,
    ) => {
        if (!extra.services.db.isAccessible()) return;
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
                        dispatch(saveEarnOnboardingThunk(account.key)),
                    ],
                    FormDraftPrefixKeyValues.map(prefix =>
                        dispatch(saveAccountFormDraftThunk(prefix, account.key)),
                    ),
                ),
            [],
        );

        try {
            await Promise.all([
                saveDevice(extra.services, device),
                saveAccounts(extra.services, accounts),
                saveGraph(extra.services, graphData),
                // eslint-disable-next-line  @typescript-eslint/no-use-before-define
                dispatch(saveDeviceMetadataErrorThunk(device)),
                ...accountPromises,
            ]);
        } catch (error) {
            console.error('Remember device:', error);
        }
    };

type SaveWalletSettingsThunkState = WalletSettingsRootState;

type SaveWalletSettingsThunkDeps = WithServices<DbDep>;

export const saveWalletSettingsThunk =
    () =>
    async (
        _dispatch: Dispatch<UnknownAction>,
        getState: () => SaveWalletSettingsThunkState,
        extra: SaveWalletSettingsThunkDeps,
    ) => {
        if (!extra.services.db.isAccessible()) return;
        await extra.services.db.addItem(
            'walletSettings',
            {
                ...selectWalletSettings(getState()),
            },
            'wallet',
            true,
        );
    };

type SaveDiscreetModeThunkState = DiscreetModeRootState;

type SaveDiscreetModeThunkDeps = WithServices<DbDep>;

export const saveDiscreetModeThunk =
    () =>
    async (
        _dispatch: Dispatch<UnknownAction>,
        getState: () => SaveDiscreetModeThunkState,
        extra: SaveDiscreetModeThunkDeps,
    ) => {
        if (!extra.services.db.isAccessible()) return;
        await extra.services.db.addItem(
            'discreetMode',
            selectDiscreetMode(getState()),
            'discreetMode',
            true,
        );
    };

type SaveBackendThunkState = BlockchainRootState;

type SaveBackendThunkDeps = WithServices<DbDep>;

export const saveBackendThunk =
    (symbol: NetworkSymbol) =>
    async (
        _dispatch: Dispatch<UnknownAction>,
        getState: () => SaveBackendThunkState,
        extra: SaveBackendThunkDeps,
    ) => {
        if (!extra.services.db.isAccessible()) return;
        await extra.services.db.addItem(
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

type SaveSuiteSettingsThunkDeps = WithServices<DbDep>;

export const saveSuiteSettingsThunk =
    () =>
    (
        _dispatch: Dispatch<UnknownAction>,
        getState: () => SaveSuiteSettingsThunkState,
        extra: SaveSuiteSettingsThunkDeps,
    ): Promise<void> => {
        if (!extra.services.db.isAccessible()) return Promise.resolve();
        const suiteSettings = selectSuiteSettings(getState());
        const flags = selectFlags(getState());
        const evmSettings = selectEvmSettings(getState());
        const seenDisconnectNotificationForDeviceIds =
            selectSeenDisconnectNotificationForDeviceIds(getState());

        const result = extra.services.db.addItem(
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

type SaveDebugSettingsThunkDeps = WithServices<DbDep>;

export const saveDebugSettingsThunk =
    () =>
    async (
        _dispatch: Dispatch<UnknownAction>,
        getState: () => SaveDebugSettingsThunkState,
        extra: SaveDebugSettingsThunkDeps,
    ) => {
        if (!extra.services.db.isAccessible()) return;
        await extra.services.db.addItem('debug', selectDebug(getState()), 'debug', true);
    };

type SaveTokenManagementThunkState = TokenDefinitionsRootState;

type SaveTokenManagementThunkDeps = WithServices<DbDep>;

export const saveTokenManagementThunk =
    (symbol: NetworkSymbol, type: DefinitionType, status: TokenManagementAction) =>
    async (
        _dispatch: Dispatch<UnknownAction>,
        getState: () => SaveTokenManagementThunkState,
        extra: SaveTokenManagementThunkDeps,
    ) => {
        if (!extra.services.db.isAccessible()) return;
        const tokenDefinitions = selectTokenDefinitions(getState());
        const tokenDefinitionsType = tokenDefinitions[symbol]?.[type];
        const data = tokenDefinitionsType?.[status];

        const key = `${symbol}-${type}-${status}`;

        await extra.services.db.removeItemByPK('tokenManagement', key);

        return data ? extra.services.db.addItem('tokenManagement', data, key, true) : undefined;
    };

type SaveAnalyticsThunkState = AnalyticsRootState;

type SaveAnalyticsThunkDeps = WithServices<DbDep>;

export const saveAnalyticsThunk =
    () =>
    (
        _dispatch: Dispatch<UnknownAction>,
        getState: () => SaveAnalyticsThunkState,
        extra: SaveAnalyticsThunkDeps,
    ) => {
        if (!extra.services.db.isAccessible()) return;

        const analytics = selectAnalytics(getState());
        extra.services.db.addItem(
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

const saveMetadata = async (
    deps: DbDep,
    metadata: Partial<Pick<MetadataState, MetadataPersistentKeys>>,
) => {
    if (!deps.db.isAccessible()) return;

    // remove undefined in metadata arg
    typedObjectKeys(metadata).forEach(key => {
        if (typeof metadata[key] === 'undefined') {
            delete metadata[key];
        }
    });
    const savedMetadata = await deps.db.getItemByPK('metadata', 'state');
    const nextMetadata = { ...savedMetadata, ...metadata } as Pick<
        MetadataState,
        MetadataPersistentKeys
    >;

    await deps.db.addItem('metadata', nextMetadata, 'state', true);
};

/**
 * save general metadata settings
 * obsolete - will be replaced with labeling settings
 */
type SaveMetadataSettingsThunkState = { metadata: MetadataState };

type SaveMetadataSettingsThunkDeps = WithServices<DbDep>;

export const saveMetadataSettingsThunk =
    () =>
    async (
        _dispatch: Dispatch<UnknownAction>,
        getState: () => SaveMetadataSettingsThunkState,
        extra: SaveMetadataSettingsThunkDeps,
    ) => {
        // for some strage race-condition reason it has to be awaited, so that the getState runs async
        if (!(await extra.services.db.isAccessible())) return;

        const metadata = selectMetadata(getState());

        await saveMetadata(extra.services, {
            providers: metadata.providers,
            enabled: metadata.enabled,
            selectedProvider: metadata.selectedProvider,
            hasLegacyLabelsMigrated: metadata.hasLegacyLabelsMigrated,
        });
    };

type SaveSuiteSyncSettingsThunkState = DesktopSuiteSyncRootState;

type SaveSuiteSyncSettingsThunkDeps = WithServices<DbDep>;

export const saveSuiteSyncSettingsThunk =
    () =>
    (
        _dispatch: Dispatch<UnknownAction>,
        getState: () => SaveSuiteSyncSettingsThunkState,
        extra: SaveSuiteSyncSettingsThunkDeps,
    ) => {
        if (!extra.services.db.isAccessible()) return;

        const suiteSync = selectSuiteSync(getState());

        return extra.services.db.addItem(
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

type SaveSuiteSyncOwnerThunkDeps = WithServices<DbDep>;

export const saveSuiteSyncOwnerThunk =
    ({ deviceStaticId, owner }: SaveSuiteSyncOwnerParams) =>
    (
        _dispatch: Dispatch<UnknownAction>,
        _getState: () => unknown,
        extra: SaveSuiteSyncOwnerThunkDeps,
    ) => {
        if (!extra.services.db.isAccessible()) return;

        if (owner === null) {
            return extra.services.db.removeItemByPK('suiteSyncOwners', deviceStaticId);
        }

        return extra.services.db.addItem('suiteSyncOwners', owner, deviceStaticId, true);
    };

type SaveSuiteSyncQuotaManagerThunkState = WithSuiteSyncQuotaManagerState;

type SaveSuiteSyncQuotaManagerThunkDeps = WithServices<DbDep>;

export const saveSuiteSyncQuotaManagerThunk =
    () =>
    (
        _dispatch: Dispatch<UnknownAction>,
        getState: () => SaveSuiteSyncQuotaManagerThunkState,
        extra: SaveSuiteSyncQuotaManagerThunkDeps,
    ) => {
        if (!extra.services.db.isAccessible()) return;

        const suiteSyncQuotaManager = selectSuiteSyncQuotaManager(getState());

        return extra.services.db.addItem(
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

type SaveDeviceMetadataErrorThunkDeps = WithServices<DbDep>;

export const saveDeviceMetadataErrorThunk =
    (device: TrezorDevice) =>
    async (
        _dispatch: Dispatch<UnknownAction>,
        getState: () => SaveDeviceMetadataErrorThunkState,
        extra: SaveDeviceMetadataErrorThunkDeps,
    ) => {
        if (!extra.services.db.isAccessible()) return;

        const error = selectMetadataError(getState());
        if (device.state?.staticSessionId && error?.[device.state.staticSessionId]) {
            await saveMetadata(extra.services, { error });
        }
    };

type SaveMessageSystemThunkState = MessageSystemRootState;

type SaveMessageSystemThunkDeps = WithServices<DbDep>;

export const saveMessageSystemThunk =
    () =>
    (
        _dispatch: Dispatch<UnknownAction>,
        getState: () => SaveMessageSystemThunkState,
        extra: SaveMessageSystemThunkDeps,
    ) => {
        if (!extra.services.db.isAccessible()) return;

        const {
            dismissedMessages,
            config,
            currentSequence,
            configSource,
            manuallyAddedMessageIds,
            manuallyAddedExperimentIds,
        } = selectMessageSystem(getState());

        extra.services.db.addItem(
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

type SavePersistentDeviceDataThunkDeps = WithServices<DbDep>;

export const savePersistentDeviceDataThunk =
    () =>
    async (
        _dispatch: Dispatch<UnknownAction>,
        getState: () => SavePersistentDeviceDataThunkState,
        extra: SavePersistentDeviceDataThunkDeps,
    ) => {
        if (!extra.services.db.isAccessible()) return;
        const data = selectPersistentDeviceData(getState());

        await extra.services.db.addItem('persistentDeviceData', data, 'persistentDeviceData', true);
    };

type SaveConnectSettingsThunkState = ConnectPopupStateRootState & WalletConnectStateRootState;

type SaveConnectSettingsThunkDeps = WithServices<DbDep>;

export const saveConnectSettingsThunk =
    () =>
    (
        _dispatch: Dispatch<UnknownAction>,
        getState: () => SaveConnectSettingsThunkState,
        extra: SaveConnectSettingsThunkDeps,
    ) => {
        if (!extra.services.db.isAccessible()) return;
        const permissions = selectConnectAppPermissions(getState());
        const walletConnectSessions = selectSessions(getState());

        extra.services.db.addItem(
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

type SaveFirmwareSettingsThunkDeps = WithServices<DbDep>;

export const saveFirmwareSettingsThunk =
    () =>
    (
        _dispatch: Dispatch<UnknownAction>,
        getState: () => SaveFirmwareSettingsThunkState,
        extra: SaveFirmwareSettingsThunkDeps,
    ) => {
        if (!extra.services.db.isAccessible()) return;
        const firmwareChannel = selectFirmwareChannel(getState());

        extra.services.db.addItem(
            'firmware',
            {
                firmwareChannel,
            },
            'firmware',
            true,
        );
    };

type SaveFeatureFeedbackThunkState = FeatureFeedbackRootState<FeedbackFeatureName>;

type SaveFeatureFeedbackThunkDeps = WithServices<DbDep>;

export const saveFeatureFeedbackThunk =
    () =>
    (
        _dispatch: Dispatch<UnknownAction>,
        getState: () => SaveFeatureFeedbackThunkState,
        extra: SaveFeatureFeedbackThunkDeps,
    ) => {
        if (!extra.services.db.isAccessible()) return;
        const featureFeedback = selectFeatureFeedback(getState());

        return extra.services.db.addItem(
            'featureFeedback',
            featureFeedback,
            'featureFeedback',
            true,
        );
    };

type RemoveDatabaseThunkState = DeviceRootState;

type RemoveDatabaseThunkDeps = WithServices<DbDep>;

export const removeDatabaseThunk =
    () =>
    async (
        dispatch: Dispatch<UnknownAction>,
        getState: () => RemoveDatabaseThunkState,
        extra: RemoveDatabaseThunkDeps,
    ) => {
        if (!extra.services.db.isAccessible()) return;

        const devices = selectDevices(getState());

        const rememberedDevices = devices.filter(d => d.remember);
        // forget all remembered devices
        rememberedDevices.forEach(d => {
            dispatch(deviceActions.forgetDevice({ device: d }));
        });
        await extra.services.db.removeDatabase();
        dispatch(
            notificationsActions.addToast({
                type: 'clear-storage',
            }),
        );
    };
