import { db } from 'src/storage';
import { FieldValues } from 'react-hook-form';

import { notificationsActions } from '@suite-common/toast-notifications';
import * as suiteActions from 'src/actions/suite/suiteActions';
import {
    serializeDiscovery,
    serializeDevice,
    serializeCoinjoinAccount,
} from 'src/utils/suite/storage';
import type { AppState, Dispatch, GetState, TrezorDevice } from 'src/types/suite';
import type { Account, Network } from 'src/types/wallet';
import type { Discovery } from 'src/reducers/wallet/discoveryReducer';
import type { FormState } from 'src/types/wallet/sendForm';
import type { Trade } from 'src/types/wallet/coinmarketCommonTypes';
import type { FormDraftKeyPrefix } from '@suite-common/wallet-types';
import type { PreloadStoreAction } from 'src/support/suite/preloadStore';
import { getFormDraftKey } from '@suite-common/wallet-utils';
import { FormDraftPrefixKeyValues } from '@suite-common/wallet-constants';
import { STORAGE } from './constants';
import { GraphData } from '../../types/wallet/graph';
import { deviceGraphDataFilterFn } from '../../utils/wallet/graphUtils';
import { selectCoinjoinAccountByKey } from 'src/reducers/wallet/coinjoinReducer';

export type StorageAction = NonNullable<PreloadStoreAction>;
export type StorageLoadAction = Extract<StorageAction, { type: typeof STORAGE.LOAD }>;

// send form drafts start
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

// send form drafts end

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
    if (!device || !device.features || !device.state) return;
    return db.addItem('devices', serializeDevice(device, forceRemember), device.state, true);
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

export const removeAccountWithDependencies = (getState: GetState) => (account: Account) =>
    Promise.all([
        ...FormDraftPrefixKeyValues.map(prefix => removeAccountFormDraft(prefix, account.key)),
        removeAccountDraft(account),
        removeAccountTransactions(account),
        removeAccountGraph(account),
        removeCoinjoinAccount(account.key, getState()),
        removeAccount(account),
    ]);

export const forgetDevice = (device: TrezorDevice) => async (_: Dispatch, getState: GetState) => {
    if (!(await db.isAccessible())) return;
    if (!device.state) return;

    const accounts = getState().wallet.accounts.filter(a => a.deviceState === device.state);

    return Promise.all([
        db.removeItemByPK('devices', device.state),
        db.removeItemByPK('discovery', device.state),
        db.removeItemByIndex('accounts', 'deviceState', device.state),
        db.removeItemByIndex('txs', 'deviceState', device.state),
        db.removeItemByIndex('graph', 'deviceState', device.state),
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
        if (!device || !device.features || !device.state) return;
        if (!remember) {
            return dispatch(forgetDevice(device));
        }

        const { wallet } = getState();
        const accounts = wallet.accounts.filter(a => a.deviceState === device.state);
        const graphData = wallet.graph.data.filter(d => deviceGraphDataFilterFn(d, device.state));
        const discovery = wallet.discovery
            .filter(d => d.deviceState === device.state)
            .map(serializeDiscovery);

        const accountPromises = accounts.reduce(
            (promises, account) =>
                promises.concat(
                    [
                        dispatch(saveAccountTransactions(account)),
                        dispatch(saveAccountDraft(account)),
                        dispatch(saveCoinjoinAccount(account.key)),
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
    (coin: Network['symbol']) => async (_dispatch: Dispatch, getState: GetState) => {
        if (!(await db.isAccessible())) return;
        await db.addItem(
            'backendSettings',
            getState().wallet.blockchain[coin].backends,
            coin,
            true,
        );
    };

export const removeFiatRate =
    (symbol: string, tokenAddress?: string) => async (_dispatch: Dispatch, _getState: GetState) => {
        if (!(await db.isAccessible())) return;
        const key = tokenAddress ? `${symbol}-${tokenAddress}` : symbol;
        return db.removeItemByPK('fiatRates', key);
    };

export const saveFiatRates = () => async (_dispatch: Dispatch, getState: GetState) => {
    if (!(await db.isAccessible())) return;
    const promises = getState().wallet.fiat.coins.map(c => {
        const key = c.tokenAddress ? `${c.symbol}-${c.tokenAddress}` : c.symbol;
        return db.addItem('fiatRates', c, key, true);
    });
    return Promise.all(promises);
};

export const saveSuiteSettings = () => async (_dispatch: Dispatch, getState: GetState) => {
    if (!(await db.isAccessible())) return;
    const { suite } = getState();
    db.addItem(
        'suiteSettings',
        {
            settings: suite.settings,
            flags: suite.flags,
        },
        'suite',
        true,
    );
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

/**
 * save general metadata settings
 */
export const saveMetadata = () => async (_dispatch: Dispatch, getState: GetState) => {
    if (!(await db.isAccessible())) return;

    const { metadata } = getState();
    db.addItem(
        'metadata',
        {
            providers: metadata.providers,
            enabled: metadata.enabled,
            selectedProvider: metadata.selectedProvider,
        },
        'state',
        true,
    );
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

    const rememberedDevices = getState().devices.filter(d => d.remember);
    // forget all remembered devices
    rememberedDevices.forEach(d => {
        dispatch(suiteActions.forgetDevice(d));
    });
    await db.removeDatabase();
    dispatch(
        notificationsActions.addToast({
            type: 'clear-storage',
        }),
    );
};
