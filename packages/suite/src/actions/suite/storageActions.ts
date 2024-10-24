import { FieldValues } from 'react-hook-form';

import { cloneObject } from '@trezor/utils';

import { Discovery, FormDraftKeyPrefix } from '@suite-common/wallet-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { selectHistoricRatesByTransactions, getFormDraftKey } from '@suite-common/wallet-utils';
import { FormDraftPrefixKeyValues } from '@suite-common/wallet-constants';
import { isDeviceAcquired } from '@suite-common/suite-utils';
import { selectDevices, deviceActions } from '@suite-common/wallet-core';

import { db } from 'src/storage';
import {
    serializeDiscovery,
    serializeDevice,
    serializeCoinjoinAccount,
} from 'src/utils/suite/storage';
import type { AppState, Dispatch, GetState, TrezorDevice } from 'src/types/suite';
import type { Account } from 'src/types/wallet';
import { NetworkSymbol } from '@suite-common/wallet-config';
import type { FormState, RatesByTimestamps } from '@suite-common/wallet-types';
import type { Trade } from 'src/types/wallet/coinmarketCommonTypes';
import type { PreloadStoreAction } from 'src/support/suite/preloadStore';
import { GraphData } from 'src/types/wallet/graph';
import { deviceGraphDataFilterFn } from 'src/utils/wallet/graph';
import { selectCoinjoinAccountByKey } from 'src/reducers/wallet/coinjoinReducer';

import { STORAGE } from './constants';
import { MetadataState } from '@suite-common/metadata-types';
import { DefinitionType, TokenManagementAction } from '@suite-common/token-definitions';
import { selectSuiteSettings } from '../../reducers/suite/suiteReducer';

export type StorageAction = NonNullable<PreloadStoreAction>;
export type StorageLoadAction = Extract<StorageAction, { type: typeof STORAGE.LOAD }>;

export const saveDraft = async (formState: FormState, accountKey: string) => {
    if (!(await db.isAccessible())) return;

    return db.addItem('sendFormDrafts', formState, accountKey, true);
};

export const removeDraft = async (accountKey: string) => {
    if (!(await db.isAccessible())) return;

    return db.removeItemByPK('sendFormDrafts', accountKey);
};

export const saveAccountDraft = (account: Account) => async (_: Dispatch, getState: GetState) => {
    if (!(await db.isAccessible())) return;
    const { drafts } = getState().wallet.send;
    const draft = drafts[account.key];
    if (draft) {
        return db.addItem('sendFormDrafts', draft, account.key, true);
    }
};

const removeAccountDraft = async (account: Account) => {
    if (!(await db.isAccessible())) return Promise.resolve();

    return db.removeItemByPK('sendFormDrafts', account.key);
};

export const saveCoinjoinAccount =
    (accountKey: string) => async (_: Dispatch, getState: GetState) => {
        const coinjoinAccount = selectCoinjoinAccountByKey(getState(), accountKey);
        if (!coinjoinAccount || !(await db.isAccessible())) return;
        const serializedAccount = serializeCoinjoinAccount(coinjoinAccount);

        return db.addItem('coinjoinAccounts', serializedAccount, accountKey, true);
    };

const removeCoinjoinRelatedSetting = (state: AppState) => {
    const settings = { ...state.suite.settings };

    settings.isCoinjoinReceiveWarningHidden = false;

    db.addItem(
        'suiteSettings',
        {
            settings,
            flags: state.suite.flags,
            evmSettings: state.suite.evmSettings,
        },
        'suite',
        true,
    );
};

export const removeCoinjoinAccount = async (accountKey: string, state: AppState) => {
    if (!(await db.isAccessible())) return;

    await db.removeItemByPK('coinjoinAccounts', accountKey);

    const savedCoinjoinAccounts = await db.getItemsExtended('coinjoinAccounts');
    if (!savedCoinjoinAccounts.length) {
        removeCoinjoinRelatedSetting(state);
    }
};

export const saveCoinjoinDebugSettings = () => async (_dispatch: Dispatch, getState: GetState) => {
    if (!(await db.isAccessible())) return;
    const { debug } = getState().wallet.coinjoin;
    db.addItem('coinjoinDebugSettings', debug || {}, 'debug', true);
};

export const saveFormDraft = async (key: string, draft: FieldValues) => {
    if (!(await db.isAccessible())) return;

    return db.addItem('formDrafts', draft, key, true);
};

export const removeFormDraft = async (key: string) => {
    if (!(await db.isAccessible())) return;

    return db.removeItemByPK('formDrafts', key);
};

export const saveAccountFormDraft =
    (prefix: FormDraftKeyPrefix, accountKey: string) => async (_: Dispatch, getState: GetState) => {
        if (!(await db.isAccessible())) return;

        const { formDrafts } = getState().wallet;

        const formDraftKey = getFormDraftKey(prefix, accountKey);
        const formDraft = formDrafts[formDraftKey];

        return formDraft ? db.addItem('formDrafts', formDraft, formDraftKey, true) : undefined;
    };

const removeAccountFormDraft = async (prefix: FormDraftKeyPrefix, accountKey: string) => {
    if (!(await db.isAccessible())) return;

    return db.removeItemByPK('formDrafts', getFormDraftKey(prefix, accountKey));
};

export const saveDevice = async (device: TrezorDevice, forceRemember?: true) => {
    if (!(await db.isAccessible())) return;
    if (!isDeviceAcquired(device) || !device.state?.staticSessionId) return;

    return db.addItem(
        'devices',
        serializeDevice(device, forceRemember),
        device.state.staticSessionId,
        true,
    );
};

const removeAccount = async (account: Account) => {
    if (!(await db.isAccessible())) return;

    return db.removeItemByPK('accounts', [account.descriptor, account.symbol, account.deviceState]);
};

export const removeAccountTransactions = async (account: Account) => {
    if (!(await db.isAccessible())) return;
    await db.removeItemByIndex('txs', 'accountKey', [
        account.descriptor,
        account.symbol,
        account.deviceState,
    ]);
};

const removeAccountGraph = async (account: Account) => {
    if (!(await db.isAccessible())) return;

    return db.removeItemByIndex('graph', 'accountKey', [
        account.descriptor,
        account.symbol,
        account.deviceState,
    ]);
};

export const removeAccountHistoricRates = async (accountKey: string) => {
    if (!(await db.isAccessible())) return;

    return db.removeItemByPK('historicRates', accountKey);
};

export const removeAccountWithDependencies = (getState: GetState) => (account: Account) =>
    Promise.all([
        ...FormDraftPrefixKeyValues.map(prefix => removeAccountFormDraft(prefix, account.key)),
        removeAccountDraft(account),
        removeAccountTransactions(account),
        removeAccountGraph(account),
        removeCoinjoinAccount(account.key, getState()),
        removeAccount(account),
        removeAccountHistoricRates(account.key),
    ]);

export const forgetDevice = (device: TrezorDevice) => async (_: Dispatch, getState: GetState) => {
    if (!(await db.isAccessible())) return;
    if (!device.state?.staticSessionId) return;
    const { staticSessionId } = device.state;

    const accounts = getState().wallet.accounts.filter(a => a.deviceState === staticSessionId);

    return Promise.all([
        db.removeItemByPK('devices', staticSessionId),
        db.removeItemByPK('discovery', staticSessionId),
        db.removeItemByIndex('accounts', 'deviceState', staticSessionId),
        db.removeItemByIndex('txs', 'deviceState', staticSessionId),
        db.removeItemByIndex('graph', 'deviceState', staticSessionId),
        ...accounts.map(removeAccountWithDependencies(getState)),
    ]);
};

export const saveAccounts = async (accounts: Account[]) => {
    if (!(await db.isAccessible())) return;

    return db.addItems('accounts', accounts, true);
};

export const saveCoinmarketTrade = async (trade: Trade) => {
    if (!(await db.isAccessible())) return;

    return db.addItem('coinmarketTrades', trade, undefined, true);
};

export const saveDiscovery = async (discoveries: Discovery[]) => {
    if (!(await db.isAccessible())) return;

    return db.addItems('discovery', discoveries, true);
};

export const saveGraph = async (graphData: GraphData[]) => {
    if (!(await db.isAccessible())) return;

    return db.addItems('graph', graphData, true);
};

export const saveAccountHistoricRates =
    (accountKey: string, historicRates: RatesByTimestamps) =>
    async (_dispatch: Dispatch, getState: GetState) => {
        if (!(await db.isAccessible())) return Promise.resolve();
        const allTxs = getState().wallet.transactions.transactions;
        const accTxs = allTxs[accountKey] || [];

        const accHistoricRates = selectHistoricRatesByTransactions(historicRates, accTxs);

        return db.addItem('historicRates', accHistoricRates, accountKey, true);
    };

export const saveAccountTransactions =
    (account: Account) => async (_dispatch: Dispatch, getState: GetState) => {
        if (!(await db.isAccessible())) return Promise.resolve();
        const allTxs = getState().wallet.transactions.transactions;
        const accTxs = allTxs[account.key] || [];

        // wrap txs and add its order inside the array
        const orderedTxs = accTxs.map((tx, order) => ({ tx, order }));

        return db.addItems('txs', orderedTxs, true);
    };

export const rememberDevice =
    (device: TrezorDevice, remember: boolean, forcedRemember?: true) =>
    async (dispatch: Dispatch, getState: GetState) => {
        if (!(await db.isAccessible())) return;
        if (!isDeviceAcquired(device) || !device.state) return;
        if (!remember) {
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            dispatch(forgetDeviceMetadataError(device));

            return dispatch(forgetDevice(device));
        }

        const { wallet } = getState();
        const accounts = wallet.accounts.filter(a => a.deviceState === device.state);
        const graphData = wallet.graph.data.filter(d =>
            deviceGraphDataFilterFn(d, device.state?.staticSessionId),
        );
        const discovery = wallet.discovery
            .filter(d => d.deviceState === device.state)
            .map(serializeDiscovery);
        const historicRates = wallet.fiat.historic;

        const accountPromises = accounts.reduce(
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
            [] as Promise<void | string | undefined | IDBValidKey>[],
        );

        try {
            await Promise.all([
                saveDevice(device, forcedRemember),
                saveAccounts(accounts),
                saveGraph(graphData),
                saveDiscovery(discovery),
                // eslint-disable-next-line  @typescript-eslint/no-use-before-define
                dispatch(saveDeviceMetadataError(device)),
                ...accountPromises,
            ] as Promise<void | string | undefined>[]);
        } catch (error) {
            console.error('Remember device:', error);
        }
    };

export const saveWalletSettings = () => async (_dispatch: Dispatch, getState: GetState) => {
    if (!(await db.isAccessible())) return;
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
    (coin: NetworkSymbol) => async (_dispatch: Dispatch, getState: GetState) => {
        if (!(await db.isAccessible())) return;
        await db.addItem(
            'backendSettings',
            getState().wallet.blockchain[coin].backends,
            coin,
            true,
        );
    };

export const saveSuiteSettings = () => async (_dispatch: Dispatch, getState: GetState) => {
    if (!(await db.isAccessible())) return;
    const { suite } = getState();
    db.addItem(
        'suiteSettings',
        {
            settings: {
                ...suite.settings,
                // Temporary measure to always start Suite with password manager off
                experimental: suite.settings.experimental?.filter(e => e !== 'password-manager'),
            },
            flags: suite.flags,
            evmSettings: suite.evmSettings,
        },
        'suite',
        true,
    );
};

export const saveTokenManagement =
    (networkSymbol: NetworkSymbol, type: DefinitionType, status: TokenManagementAction) =>
    async (_dispatch: Dispatch, getState: GetState) => {
        if (!(await db.isAccessible())) return;
        const { tokenDefinitions } = getState();
        const tokenDefinitionsType = tokenDefinitions[networkSymbol]?.[type];
        const data = tokenDefinitionsType?.[status];

        const key = `${networkSymbol}-${type}-${status}`;

        await db.removeItemByPK('tokenManagement', key);

        return data ? db.addItem('tokenManagement', data, key, true) : undefined;
    };

export const saveAnalytics = () => async (_dispatch: Dispatch, getState: GetState) => {
    if (!(await db.isAccessible())) return;

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

const saveMetadata = async (metadata: Partial<Pick<MetadataState, MetadataPersistentKeys>>) => {
    if (!(await db.isAccessible())) return;

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
 */
export const saveMetadataSettings = () => async (_dispatch: Dispatch, getState: GetState) => {
    if (!(await db.isAccessible())) return;

    const { metadata } = getState();

    saveMetadata({
        providers: metadata.providers,
        enabled: metadata.enabled,
        selectedProvider: metadata.selectedProvider,
    });
};

export const saveDeviceMetadataError =
    (device: TrezorDevice) => async (_dispatch: Dispatch, getState: GetState) => {
        if (!(await db.isAccessible())) return;

        const { metadata } = getState();
        if (device.state?.staticSessionId && metadata?.error?.[device.state.staticSessionId]) {
            const { error } = metadata;
            await saveMetadata({ error });
        }
    };

export const forgetDeviceMetadataError =
    (device: TrezorDevice) => async (_dispatch: Dispatch, getState: GetState) => {
        if (!(await db.isAccessible())) return;

        const { metadata } = getState();
        if (device.state?.staticSessionId && metadata?.error) {
            const next = cloneObject(metadata.error);
            delete next[device.state.staticSessionId];
            saveMetadata({ error: next });
        }
    };

export const saveMessageSystem = () => async (_dispatch: Dispatch, getState: GetState) => {
    if (!(await db.isAccessible())) return;

    const { dismissedMessages, config, currentSequence } = getState().messageSystem;

    db.addItem(
        'messageSystem',
        {
            config,
            currentSequence,
            dismissedMessages,
        },
        'suite',
        true,
    );
};

export const saveFirmware = () => async (_dispatch: Dispatch, getState: GetState) => {
    if (!(await db.isAccessible())) return;
    const { firmware } = getState();

    db.addItem('firmware', { firmwareHashInvalid: firmware.firmwareHashInvalid }, 'firmware', true);
};

export const removeDatabase = () => async (dispatch: Dispatch, getState: GetState) => {
    if (!(await db.isAccessible())) return;

    const devices = selectDevices(getState());
    const settings = selectSuiteSettings(getState());

    const rememberedDevices = devices.filter(d => d.remember);
    // forget all remembered devices
    rememberedDevices.forEach(d => {
        dispatch(deviceActions.forgetDevice({ device: d, settings }));
    });
    await db.removeDatabase();
    dispatch(
        notificationsActions.addToast({
            type: 'clear-storage',
        }),
    );
};
