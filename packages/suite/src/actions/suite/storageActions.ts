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
import {
    type NetworkConfigDeps,
    type NetworksRootState,
    selectNetworkConfigAccessors,
} from '@suite-common/networks';
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
import { getSuiteDB } from 'src/storage';
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

export const saveExplorer = (
    networkConfigDeps: NetworkConfigDeps,
    {
        symbol,
        explorer,
    }: {
        symbol: NetworkSymbol;
        explorer?: Explorer;
    },
) => {
    if (!getSuiteDB(networkConfigDeps).isAccessible()) return;

    getSuiteDB(networkConfigDeps).removeItemByPK('explorer', symbol);

    if (explorer !== undefined) {
        return getSuiteDB(networkConfigDeps).addItem('explorer', { symbol, explorer }, symbol);
    }
};

export const saveDraft = (
    networkConfigDeps: NetworkConfigDeps,
    formState: FormState,
    accountKey: AccountKey,
) => {
    if (!getSuiteDB(networkConfigDeps).isAccessible()) return;

    return getSuiteDB(networkConfigDeps).addItem('sendFormDrafts', formState, accountKey, true);
};

export const removeDraft = (networkConfigDeps: NetworkConfigDeps, accountKey: AccountKey) => {
    if (!getSuiteDB(networkConfigDeps).isAccessible()) return;

    return getSuiteDB(networkConfigDeps).removeItemByPK('sendFormDrafts', accountKey);
};

type SaveAccountDraftThunkState = SendRootState;

export const saveAccountDraftThunk =
    (networkConfigDeps: NetworkConfigDeps, account: Account) =>
    (_: Dispatch<UnknownAction>, getState: () => SaveAccountDraftThunkState) => {
        if (!getSuiteDB(networkConfigDeps).isAccessible()) return;
        const drafts = selectSendFormDrafts(getState());
        const draft = drafts[account.key];
        if (draft) {
            return getSuiteDB(networkConfigDeps).addItem(
                'sendFormDrafts',
                draft,
                account.key,
                true,
            );
        }
    };

type SaveAccountReceiveThunkState = ReceiveRootState;

export const saveAccountReceiveThunk =
    (networkConfigDeps: NetworkConfigDeps, accountKey: AccountKey) =>
    (_: Dispatch<UnknownAction>, getState: () => SaveAccountReceiveThunkState) => {
        if (!getSuiteDB(networkConfigDeps).isAccessible()) return;

        const receiveAccount = selectReceiveAccountState(getState(), accountKey);

        return receiveAccount
            ? getSuiteDB(networkConfigDeps).addItem('receive', receiveAccount, accountKey, true)
            : undefined;
    };

type SaveEarnOnboardingThunkState = EarnOnboardingRootState;

export const saveEarnOnboardingThunk =
    (networkConfigDeps: NetworkConfigDeps, accountKey: AccountKey) =>
    (_: Dispatch<UnknownAction>, getState: () => SaveEarnOnboardingThunkState) => {
        if (!getSuiteDB(networkConfigDeps).isAccessible()) return;

        const confirmedOpportunities = selectConfirmedEarnOpportunities(getState(), accountKey);

        return confirmedOpportunities
            ? getSuiteDB(networkConfigDeps).addItem(
                  'earnOnboarding',
                  confirmedOpportunities,
                  accountKey,
                  true,
              )
            : undefined;
    };

const removeEarnOnboarding = (networkConfigDeps: NetworkConfigDeps, accountKey: AccountKey) => {
    if (!getSuiteDB(networkConfigDeps).isAccessible()) return Promise.resolve();

    return getSuiteDB(networkConfigDeps).removeItemByPK('earnOnboarding', accountKey);
};

const removeAccountDraft = (networkConfigDeps: NetworkConfigDeps, account: Account) => {
    if (!getSuiteDB(networkConfigDeps).isAccessible()) return Promise.resolve();

    return getSuiteDB(networkConfigDeps).removeItemByPK('sendFormDrafts', account.key);
};

type SaveCoinjoinAccountThunkState = CoinjoinRootState;

export const saveCoinjoinAccountThunk =
    (networkConfigDeps: NetworkConfigDeps, accountKey: AccountKey) =>
    (_: Dispatch<UnknownAction>, getState: () => SaveCoinjoinAccountThunkState) => {
        const coinjoinAccount = selectCoinjoinAccountByKey(getState(), accountKey);
        if (!coinjoinAccount || !getSuiteDB(networkConfigDeps).isAccessible()) return;
        const serializedAccount = serializeCoinjoinAccount(coinjoinAccount);

        return getSuiteDB(networkConfigDeps).addItem(
            'coinjoinAccounts',
            serializedAccount,
            accountKey,
            true,
        );
    };

type RemoveCoinjoinRelatedSettingState = FlagsRootState &
    SuiteSettingsRootState & {
        suite: Pick<SuiteState, 'evmSettings' | 'seenDisconnectNotificationForDeviceIds'>;
    };

const removeCoinjoinRelatedSetting = (
    networkConfigDeps: NetworkConfigDeps,
    state: RemoveCoinjoinRelatedSettingState,
) => {
    const settings = { ...selectSuiteSettings(state) };

    settings.isCoinjoinReceiveWarningHidden = false;

    getSuiteDB(networkConfigDeps).addItem(
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
    networkConfigDeps: NetworkConfigDeps,
    accountKey: AccountKey,
    state: RemoveCoinjoinAccountState,
) => {
    if (!getSuiteDB(networkConfigDeps).isAccessible()) return;

    await getSuiteDB(networkConfigDeps).removeItemByPK('coinjoinAccounts', accountKey);

    const savedCoinjoinAccounts =
        await getSuiteDB(networkConfigDeps).getItemsExtended('coinjoinAccounts');
    if (!savedCoinjoinAccounts.length) {
        removeCoinjoinRelatedSetting(networkConfigDeps, state);
    }
};

type SaveCoinjoinDebugSettingsThunkState = CoinjoinRootState;

export const saveCoinjoinDebugSettingsThunk =
    (networkConfigDeps: NetworkConfigDeps) =>
    (_dispatch: Dispatch<UnknownAction>, getState: () => SaveCoinjoinDebugSettingsThunkState) => {
        if (!getSuiteDB(networkConfigDeps).isAccessible()) return;
        const debug = selectCoinjoinDebug(getState());
        getSuiteDB(networkConfigDeps).addItem('coinjoinDebugSettings', debug || {}, 'debug', true);
    };

type SaveThpCredentialsThunkState = ThpRootState & NetworksRootState;

export const saveThpCredentialsThunk = createThunk<
    void,
    void,
    { state: SaveThpCredentialsThunkState }
>(`${STORAGE.MODULE_PREFIX}/saveThpCredentials`, async (_, { getState }) => {
    const networkConfigDeps = selectNetworkConfigAccessors(getState());

    if (!getSuiteDB(networkConfigDeps).isAccessible()) return;
    const { credentials } = selectThp(getState());
    await getSuiteDB(networkConfigDeps).addItem('thp', { credentials }, 'value', true);
});

type SaveKnownDevicesThunkState = WithBluetoothState<DesktopBluetoothDevice> & NetworksRootState;

export const saveKnownDevicesThunk = createThunk<void, void, { state: SaveKnownDevicesThunkState }>(
    `${STORAGE.MODULE_PREFIX}/saveKnownDevices`,
    async (_, { getState }) => {
        const networkConfigDeps = selectNetworkConfigAccessors(getState());

        if (!getSuiteDB(networkConfigDeps).isAccessible()) return;
        const knownDevices = selectKnownDevices<DesktopBluetoothDevice>(getState());

        await getSuiteDB(networkConfigDeps).addItem(
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
    (networkConfigDeps: NetworkConfigDeps, prefix: FormDraftKeyPrefix, accountKey: string) =>
    (_: Dispatch<UnknownAction>, getState: () => SaveAccountFormDraftThunkState) => {
        if (!getSuiteDB(networkConfigDeps).isAccessible()) return;

        const formDraftKey = getFormDraftKey(prefix, accountKey);
        const formDraft = selectFormDraft(getState(), formDraftKey);

        return formDraft
            ? getSuiteDB(networkConfigDeps).addItem('formDrafts', formDraft, formDraftKey, true)
            : undefined;
    };

const removeAccountFormDraft = (
    networkConfigDeps: NetworkConfigDeps,
    prefix: FormDraftKeyPrefix,
    accountKey: string,
) => {
    if (!getSuiteDB(networkConfigDeps).isAccessible()) return;

    return getSuiteDB(networkConfigDeps).removeItemByPK(
        'formDrafts',
        getFormDraftKey(prefix, accountKey),
    );
};

export const saveDevice = (networkConfigDeps: NetworkConfigDeps, device: TrezorDevice) => {
    if (!getSuiteDB(networkConfigDeps).isAccessible()) return;
    if (!isDeviceAcquired(device) || !device.state?.staticSessionId) return;

    return getSuiteDB(networkConfigDeps).addItem(
        'devices',
        serializeDevice(device),
        device.state.staticSessionId,
        true,
    );
};

const removeAccount = (networkConfigDeps: NetworkConfigDeps, account: Account) => {
    if (!getSuiteDB(networkConfigDeps).isAccessible()) return;

    return getSuiteDB(networkConfigDeps).removeItemByPK('accounts', [
        account.descriptor,
        account.symbol,
        account.deviceState,
    ]);
};

export const removeAccountTransactions = async (
    networkConfigDeps: NetworkConfigDeps,
    account: Account,
) => {
    if (!getSuiteDB(networkConfigDeps).isAccessible()) return;
    await getSuiteDB(networkConfigDeps).removeItemByIndex('txs', 'accountKey', [
        account.descriptor,
        account.symbol,
        account.deviceState,
    ]);
};

const removeAccountGraph = (networkConfigDeps: NetworkConfigDeps, account: Account) => {
    if (!getSuiteDB(networkConfigDeps).isAccessible()) return;

    return getSuiteDB(networkConfigDeps).removeItemByIndex('graph', 'accountKey', [
        account.descriptor,
        account.symbol,
        account.deviceState,
    ]);
};

export const removeAccountHistoricRates = (
    networkConfigDeps: NetworkConfigDeps,
    accountKey: string,
) => {
    if (!getSuiteDB(networkConfigDeps).isAccessible()) return;

    return getSuiteDB(networkConfigDeps).removeItemByPK('historicRates', accountKey);
};

export const removeAccountPhishing = (
    networkConfigDeps: NetworkConfigDeps,
    accountKey: AccountKey,
) => {
    if (!getSuiteDB(networkConfigDeps).isAccessible()) return;

    return getSuiteDB(networkConfigDeps).removeItemByPK('phishing', accountKey);
};

type RemoveAccountWithDependenciesState = FlagsRootState &
    SuiteSettingsRootState & {
        suite: Pick<SuiteState, 'evmSettings' | 'seenDisconnectNotificationForDeviceIds'>;
    };

export const removeAccountWithDependencies =
    (networkConfigDeps: NetworkConfigDeps, getState: () => RemoveAccountWithDependenciesState) =>
    (account: Account) =>
        Promise.all([
            ...FormDraftPrefixKeyValues.map(prefix =>
                removeAccountFormDraft(networkConfigDeps, prefix, account.key),
            ),
            removeAccountDraft(networkConfigDeps, account),
            getSuiteDB(networkConfigDeps).removeItemByPK('receive', account.key),
            removeAccountTransactions(networkConfigDeps, account),
            removeAccountGraph(networkConfigDeps, account),
            removeCoinjoinAccount(networkConfigDeps, account.key, getState()),
            removeAccount(networkConfigDeps, account),
            removeAccountHistoricRates(networkConfigDeps, account.key),
            removeAccountPhishing(networkConfigDeps, account.key),
            removeEarnOnboarding(networkConfigDeps, account.key),
        ]);

type ForgetDeviceThunkState = AccountsRootState &
    RemoveAccountWithDependenciesState & { metadata: MetadataState };

export const forgetDeviceThunk =
    (networkConfigDeps: NetworkConfigDeps, device: TrezorDevice) =>
    (_: Dispatch<UnknownAction>, getState: () => ForgetDeviceThunkState) => {
        if (!getSuiteDB(networkConfigDeps).isAccessible()) return;
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
            getSuiteDB(networkConfigDeps).removeItemByPK('devices', staticSessionId),
            getSuiteDB(networkConfigDeps).removeItemByPK('suiteSyncOwners', staticSessionId),
            getSuiteDB(networkConfigDeps).removeItemByIndex(
                'accounts',
                'deviceState',
                staticSessionId,
            ),
            getSuiteDB(networkConfigDeps).removeItemByIndex('txs', 'deviceState', staticSessionId),
            getSuiteDB(networkConfigDeps).removeItemByIndex(
                'graph',
                'deviceState',
                staticSessionId,
            ),
            ...accounts.map(removeAccountWithDependencies(networkConfigDeps, getState)),
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            saveMetadata(networkConfigDeps, { error, hasLegacyLabelsMigrated }),
        ]);
    };

// The 'accounts' store keys records by these fields (its IndexedDB keyPath). `satisfies` ensures
// they stay valid account fields, so a rename/typo is a compile error here rather than at runtime.
const ACCOUNT_KEY_PATH_FIELDS = [
    'descriptor',
    'symbol',
    'deviceState',
] as const satisfies readonly (keyof SuccessfulAccount)[];

export const saveAccounts = async (
    networkConfigDeps: NetworkConfigDeps,
    accounts: SuccessfulAccount[],
) => {
    if (!getSuiteDB(networkConfigDeps).isAccessible()) return;

    try {
        return await getSuiteDB(networkConfigDeps).addItems('accounts', accounts, true);
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

export const saveTradingTrade = (
    networkConfigDeps: NetworkConfigDeps,
    trade: TradingTransaction,
) => {
    if (!getSuiteDB(networkConfigDeps).isAccessible()) return;

    return getSuiteDB(networkConfigDeps).addItem('tradingTrades', trade, undefined, true);
};

export const saveGraph = (networkConfigDeps: NetworkConfigDeps, graphData: GraphData[]) => {
    if (!getSuiteDB(networkConfigDeps).isAccessible()) return;

    return getSuiteDB(networkConfigDeps).addItems('graph', graphData, true);
};

type SaveAccountHistoricRatesThunkState = TransactionsRootState;

export const saveAccountHistoricRatesThunk =
    (
        networkConfigDeps: NetworkConfigDeps,
        accountKey: AccountKey,
        historicRates: RatesByTimestamps,
    ) =>
    (_dispatch: Dispatch<UnknownAction>, getState: () => SaveAccountHistoricRatesThunkState) => {
        if (!getSuiteDB(networkConfigDeps).isAccessible()) return Promise.resolve();
        const allTxs = selectTransactions(getState());
        const accTxs = (allTxs[accountKey] || []).filter(isNotNullOrUndefined);

        const accHistoricRates = selectHistoricRatesByTransactions(historicRates, accTxs);

        return getSuiteDB(networkConfigDeps).addItem(
            'historicRates',
            accHistoricRates,
            accountKey,
            true,
        );
    };

type SaveAccountTransactionsThunkState = TransactionsRootState;

export const saveAccountTransactionsThunk =
    (networkConfigDeps: NetworkConfigDeps, account: Account) =>
    (_dispatch: Dispatch<UnknownAction>, getState: () => SaveAccountTransactionsThunkState) => {
        if (!getSuiteDB(networkConfigDeps).isAccessible()) return Promise.resolve();
        const transactions = selectTransactions(getState());
        const phishing = selectPhishingTransactions(getState());
        const accTxs = transactions[account.key] || [];

        // wrap txs and add its order inside the array
        const orderedTxs = accTxs.map((tx, order) => ({ tx, order })).filter(({ tx }) => !!tx);
        const transactionsPromise = getSuiteDB(networkConfigDeps).addItems('txs', orderedTxs, true);

        const phishingList = phishing[account.key] ?? [];
        const phishingPromise =
            phishingList.length > 0
                ? getSuiteDB(networkConfigDeps).addItem('phishing', phishingList, account.key, true)
                : getSuiteDB(networkConfigDeps).removeItemByPK('phishing', account.key);

        return Promise.all([transactionsPromise, phishingPromise]);
    };

type SavePhishingMetadataThunkState = PhishingRootState;

export const savePhishingMetadataThunk =
    (networkConfigDeps: NetworkConfigDeps, phishingMetadata: Partial<PhishingState>) =>
    (_dispatch: Dispatch<UnknownAction>, getState: () => SavePhishingMetadataThunkState) => {
        if (!getSuiteDB(networkConfigDeps).isAccessible()) return;
        const oldState = selectPhishing(getState());
        const newState = { ...oldState, ...phishingMetadata };

        return getSuiteDB(networkConfigDeps).addItem(
            'phishingMetadata',
            newState,
            'phishingMetadata',
            true,
        );
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

export const rememberDeviceThunk =
    (networkConfigDeps: NetworkConfigDeps, device: TrezorDevice) =>
    async (
        dispatch: ThunkDispatch<RememberDeviceThunkState, unknown, UnknownAction>,
        getState: () => RememberDeviceThunkState,
    ) => {
        if (!getSuiteDB(networkConfigDeps).isAccessible()) return;
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
                        dispatch(saveAccountReceiveThunk(networkConfigDeps, account.key)),
                        dispatch(saveAccountTransactionsThunk(networkConfigDeps, account)),
                        dispatch(saveAccountDraftThunk(networkConfigDeps, account)),
                        dispatch(saveCoinjoinAccountThunk(networkConfigDeps, account.key)),
                        dispatch(
                            saveAccountHistoricRatesThunk(
                                networkConfigDeps,
                                account.key,
                                historicRates,
                            ),
                        ),
                        dispatch(saveEarnOnboardingThunk(networkConfigDeps, account.key)),
                    ],
                    FormDraftPrefixKeyValues.map(prefix =>
                        dispatch(saveAccountFormDraftThunk(networkConfigDeps, prefix, account.key)),
                    ),
                ),
            [],
        );

        try {
            await Promise.all([
                saveDevice(networkConfigDeps, device),
                saveAccounts(networkConfigDeps, accounts),
                saveGraph(networkConfigDeps, graphData),
                // eslint-disable-next-line  @typescript-eslint/no-use-before-define
                dispatch(saveDeviceMetadataErrorThunk(networkConfigDeps, device)),
                ...accountPromises,
            ]);
        } catch (error) {
            console.error('Remember device:', error);
        }
    };

type SaveWalletSettingsThunkState = WalletSettingsRootState;

export const saveWalletSettingsThunk =
    (networkConfigDeps: NetworkConfigDeps) =>
    async (_dispatch: Dispatch<UnknownAction>, getState: () => SaveWalletSettingsThunkState) => {
        if (!getSuiteDB(networkConfigDeps).isAccessible()) return;
        await getSuiteDB(networkConfigDeps).addItem(
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
    (networkConfigDeps: NetworkConfigDeps) =>
    async (_dispatch: Dispatch<UnknownAction>, getState: () => SaveDiscreetModeThunkState) => {
        if (!getSuiteDB(networkConfigDeps).isAccessible()) return;
        await getSuiteDB(networkConfigDeps).addItem(
            'discreetMode',
            selectDiscreetMode(getState()),
            'discreetMode',
            true,
        );
    };

type SaveBackendThunkState = BlockchainRootState;

export const saveBackendThunk =
    (networkConfigDeps: NetworkConfigDeps, symbol: NetworkSymbol) =>
    async (_dispatch: Dispatch<UnknownAction>, getState: () => SaveBackendThunkState) => {
        if (!getSuiteDB(networkConfigDeps).isAccessible()) return;
        await getSuiteDB(networkConfigDeps).addItem(
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
    (networkConfigDeps: NetworkConfigDeps) =>
    (
        _dispatch: Dispatch<UnknownAction>,
        getState: () => SaveSuiteSettingsThunkState,
    ): Promise<void> => {
        if (!getSuiteDB(networkConfigDeps).isAccessible()) return Promise.resolve();
        const suiteSettings = selectSuiteSettings(getState());
        const flags = selectFlags(getState());
        const evmSettings = selectEvmSettings(getState());
        const seenDisconnectNotificationForDeviceIds =
            selectSeenDisconnectNotificationForDeviceIds(getState());

        const result = getSuiteDB(networkConfigDeps).addItem(
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
    (networkConfigDeps: NetworkConfigDeps) =>
    async (_dispatch: Dispatch<UnknownAction>, getState: () => SaveDebugSettingsThunkState) => {
        if (!getSuiteDB(networkConfigDeps).isAccessible()) return;
        await getSuiteDB(networkConfigDeps).addItem(
            'debug',
            selectDebug(getState()),
            'debug',
            true,
        );
    };

type SaveTokenManagementThunkState = TokenDefinitionsRootState;

export const saveTokenManagementThunk =
    (
        networkConfigDeps: NetworkConfigDeps,
        symbol: NetworkSymbol,
        type: DefinitionType,
        status: TokenManagementAction,
    ) =>
    async (_dispatch: Dispatch<UnknownAction>, getState: () => SaveTokenManagementThunkState) => {
        if (!getSuiteDB(networkConfigDeps).isAccessible()) return;
        const tokenDefinitions = selectTokenDefinitions(getState());
        const tokenDefinitionsType = tokenDefinitions[symbol]?.[type];
        const data = tokenDefinitionsType?.[status];

        const key = `${symbol}-${type}-${status}`;

        await getSuiteDB(networkConfigDeps).removeItemByPK('tokenManagement', key);

        return data
            ? getSuiteDB(networkConfigDeps).addItem('tokenManagement', data, key, true)
            : undefined;
    };

type SaveAnalyticsThunkState = AnalyticsRootState;

export const saveAnalyticsThunk =
    (networkConfigDeps: NetworkConfigDeps) =>
    (_dispatch: Dispatch<UnknownAction>, getState: () => SaveAnalyticsThunkState) => {
        if (!getSuiteDB(networkConfigDeps).isAccessible()) return;

        const analytics = selectAnalytics(getState());
        getSuiteDB(networkConfigDeps).addItem(
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
    networkConfigDeps: NetworkConfigDeps,
    metadata: Partial<Pick<MetadataState, MetadataPersistentKeys>>,
) => {
    if (!getSuiteDB(networkConfigDeps).isAccessible()) return;

    // remove undefined in metadata arg
    typedObjectKeys(metadata).forEach(key => {
        if (typeof metadata[key] === 'undefined') {
            delete metadata[key];
        }
    });
    const savedMetadata = await getSuiteDB(networkConfigDeps).getItemByPK('metadata', 'state');
    const nextMetadata = { ...savedMetadata, ...metadata } as Pick<
        MetadataState,
        MetadataPersistentKeys
    >;

    await getSuiteDB(networkConfigDeps).addItem('metadata', nextMetadata, 'state', true);
};

/**
 * save general metadata settings
 * obsolete - will be replaced with labeling settings
 */
type SaveMetadataSettingsThunkState = { metadata: MetadataState };

export const saveMetadataSettingsThunk =
    (networkConfigDeps: NetworkConfigDeps) =>
    async (_dispatch: Dispatch<UnknownAction>, getState: () => SaveMetadataSettingsThunkState) => {
        // for some strage race-condition reason it has to be awaited, so that the getState runs async
        if (!(await getSuiteDB(networkConfigDeps).isAccessible())) return;

        const metadata = selectMetadata(getState());

        await saveMetadata(networkConfigDeps, {
            providers: metadata.providers,
            enabled: metadata.enabled,
            selectedProvider: metadata.selectedProvider,
            hasLegacyLabelsMigrated: metadata.hasLegacyLabelsMigrated,
        });
    };

type SaveSuiteSyncSettingsThunkState = DesktopSuiteSyncRootState;

export const saveSuiteSyncSettingsThunk =
    (networkConfigDeps: NetworkConfigDeps) =>
    (_dispatch: Dispatch<UnknownAction>, getState: () => SaveSuiteSyncSettingsThunkState) => {
        if (!getSuiteDB(networkConfigDeps).isAccessible()) return;

        const suiteSync = selectSuiteSync(getState());

        return getSuiteDB(networkConfigDeps).addItem(
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
    (networkConfigDeps: NetworkConfigDeps, { deviceStaticId, owner }: SaveSuiteSyncOwnerParams) =>
    () => {
        if (!getSuiteDB(networkConfigDeps).isAccessible()) return;

        if (owner === null) {
            return getSuiteDB(networkConfigDeps).removeItemByPK('suiteSyncOwners', deviceStaticId);
        }

        return getSuiteDB(networkConfigDeps).addItem(
            'suiteSyncOwners',
            owner,
            deviceStaticId,
            true,
        );
    };

type SaveSuiteSyncQuotaManagerThunkState = WithSuiteSyncQuotaManagerState;

export const saveSuiteSyncQuotaManagerThunk =
    (networkConfigDeps: NetworkConfigDeps) =>
    (_dispatch: Dispatch<UnknownAction>, getState: () => SaveSuiteSyncQuotaManagerThunkState) => {
        if (!getSuiteDB(networkConfigDeps).isAccessible()) return;

        const suiteSyncQuotaManager = selectSuiteSyncQuotaManager(getState());

        return getSuiteDB(networkConfigDeps).addItem(
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
    (networkConfigDeps: NetworkConfigDeps, device: TrezorDevice) =>
    async (
        _dispatch: Dispatch<UnknownAction>,
        getState: () => SaveDeviceMetadataErrorThunkState,
    ) => {
        if (!getSuiteDB(networkConfigDeps).isAccessible()) return;

        const error = selectMetadataError(getState());
        if (device.state?.staticSessionId && error?.[device.state.staticSessionId]) {
            await saveMetadata(networkConfigDeps, { error });
        }
    };

type SaveMessageSystemThunkState = MessageSystemRootState;

export const saveMessageSystemThunk =
    (networkConfigDeps: NetworkConfigDeps) =>
    (_dispatch: Dispatch<UnknownAction>, getState: () => SaveMessageSystemThunkState) => {
        if (!getSuiteDB(networkConfigDeps).isAccessible()) return;

        const {
            dismissedMessages,
            config,
            currentSequence,
            configSource,
            manuallyAddedMessageIds,
            manuallyAddedExperimentIds,
        } = selectMessageSystem(getState());

        getSuiteDB(networkConfigDeps).addItem(
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
    (networkConfigDeps: NetworkConfigDeps) =>
    async (
        _dispatch: Dispatch<UnknownAction>,
        getState: () => SavePersistentDeviceDataThunkState,
    ) => {
        if (!getSuiteDB(networkConfigDeps).isAccessible()) return;
        const data = selectPersistentDeviceData(getState());

        await getSuiteDB(networkConfigDeps).addItem(
            'persistentDeviceData',
            data,
            'persistentDeviceData',
            true,
        );
    };

type SaveConnectSettingsThunkState = ConnectPopupStateRootState & WalletConnectStateRootState;

export const saveConnectSettingsThunk =
    (networkConfigDeps: NetworkConfigDeps) =>
    (_dispatch: Dispatch<UnknownAction>, getState: () => SaveConnectSettingsThunkState) => {
        if (!getSuiteDB(networkConfigDeps).isAccessible()) return;
        const permissions = selectConnectAppPermissions(getState());
        const walletConnectSessions = selectSessions(getState());

        getSuiteDB(networkConfigDeps).addItem(
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
    (networkConfigDeps: NetworkConfigDeps) =>
    (_dispatch: Dispatch<UnknownAction>, getState: () => SaveFirmwareSettingsThunkState) => {
        if (!getSuiteDB(networkConfigDeps).isAccessible()) return;
        const firmwareChannel = selectFirmwareChannel(getState());

        getSuiteDB(networkConfigDeps).addItem(
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
    (networkConfigDeps: NetworkConfigDeps) =>
    (_dispatch: Dispatch<UnknownAction>, getState: () => SaveFeatureFeedbackThunkState) => {
        if (!getSuiteDB(networkConfigDeps).isAccessible()) return;
        const featureFeedback = selectFeatureFeedback(getState());

        return getSuiteDB(networkConfigDeps).addItem(
            'featureFeedback',
            featureFeedback,
            'featureFeedback',
            true,
        );
    };

type RemoveDatabaseThunkState = DeviceRootState;

export const removeDatabaseThunk =
    (networkConfigDeps: NetworkConfigDeps) =>
    async (dispatch: Dispatch<UnknownAction>, getState: () => RemoveDatabaseThunkState) => {
        if (!getSuiteDB(networkConfigDeps).isAccessible()) return;

        const devices = selectDevices(getState());

        const rememberedDevices = devices.filter(d => d.remember);
        // forget all remembered devices
        rememberedDevices.forEach(d => {
            dispatch(deviceActions.forgetDevice({ device: d }));
        });
        await getSuiteDB(networkConfigDeps).removeDatabase();
        dispatch(
            notificationsActions.addToast({
                type: 'clear-storage',
            }),
        );
    };
