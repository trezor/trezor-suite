import { db } from '@suite/storage';
import { STORAGE } from './constants';
import { Dispatch, GetState, AppState, TrezorDevice } from '@suite-types';
import { Account } from '@wallet-types';
import { GraphData } from '@wallet-types/graph';
import { getAccountKey } from '@wallet-utils/accountUtils';
import { Discovery } from '@wallet-reducers/discoveryReducer';
import * as notificationActions from '@suite-actions/notificationActions';
import * as suiteActions from '@suite-actions/suiteActions';
import { serializeDiscovery, serializeDevice } from '@suite-utils/storage';
import { deviceGraphDataFilterFn } from '@wallet-utils/graphUtils';
import { FormState } from '@wallet-types/sendForm';
import { BuyTrade, ExchangeTrade } from 'invity-api';

export type StorageAction =
    | { type: typeof STORAGE.LOAD }
    | { type: typeof STORAGE.LOADED; payload: AppState }
    | { type: typeof STORAGE.ERROR; error: any };

const isDBAccessible = async () => {
    const isSupported = await db.isSupported();
    // if the instance is blocking db upgrade, db connection will be closed
    return isSupported && !db.blocking && !db.blocked;
};

// send form drafts start
export const saveDraft = async (formState: FormState, accountKey: string) => {
    if (!(await isDBAccessible())) return;
    return db.addItem('sendFormDrafts', formState, accountKey, true);
};

export const removeDraft = async (accountKey: string) => {
    if (!(await isDBAccessible())) return;
    return db.removeItemByPK('sendFormDrafts', accountKey);
};

// eslint-disable-next-line require-await
export const saveAccountDraft = (account: Account) => async (_: Dispatch, getState: GetState) => {
    if (!(await isDBAccessible())) return;
    const { drafts } = getState().wallet.send;
    const draft = drafts[account.key];
    if (draft) {
        return db.addItem('sendFormDrafts', draft, account.key, true);
    }
};

export const removeAccountDraft = async (account: Account) => {
    if (!(await isDBAccessible())) return Promise.resolve();
    return db.removeItemByPK('sendFormDrafts', account.key);
};

// send form drafts end

export const saveDevice = async (device: TrezorDevice, forceRemember?: true) => {
    if (!(await isDBAccessible())) return;
    if (!device || !device.features || !device.state) return;
    return db.addItem('devices', serializeDevice(device, forceRemember), device.state, true);
};

export const removeAccount = async (account: Account) => {
    if (!(await isDBAccessible())) return;
    return db.removeItemByPK('accounts', [account.descriptor, account.symbol, account.deviceState]);
};

export const removeAccountTransactions = async (account: Account) => {
    if (!(await isDBAccessible())) return;
    await db.removeItemByIndex('txs', 'accountKey', [
        account.descriptor,
        account.symbol,
        account.deviceState,
    ]);
};

export const forgetDevice = (device: TrezorDevice) => async (_: Dispatch, getState: GetState) => {
    if (!(await isDBAccessible())) return;
    if (!device.state) return;
    const accounts = getState().wallet.accounts.filter(a => a.deviceState === device.state);
    const accountPromises = accounts.reduce((promises, account) => {
        return promises.concat([removeAccountDraft(account)]);
    }, [] as Promise<any>[]);
    const promises = await Promise.all([
        db.removeItemByPK('devices', device.state),
        db.removeItemByIndex('accounts', 'deviceState', device.state),
        db.removeItemByPK('discovery', device.state),
        db.removeItemByIndex('txs', 'deviceState', device.state),
        db.removeItemByIndex('graph', 'deviceState', device.state),
        ...accountPromises,
    ]);
    return promises;
};

export const saveAccounts = async (accounts: Account[]) => {
    if (!(await isDBAccessible())) return;
    return db.addItems('accounts', accounts, true);
};

interface AccountPart {
    symbol: Account['symbol'];
    accountType: Account['accountType'];
    accountIndex: Account['index'];
    descriptor: Account['descriptor'];
}

export const saveBuyTrade = async (buyTrade: BuyTrade, account: AccountPart, date: string) => {
    if (!(await isDBAccessible())) return;
    return db.addItem(
        'coinmarketTrades',
        {
            key: buyTrade.paymentId,
            tradeType: 'buy',
            date,
            data: buyTrade,
            account: {
                descriptor: account.descriptor,
                symbol: account.symbol,
                accountType: account.accountType,
                accountIndex: account.accountIndex,
            },
        },
        undefined,
        true,
    );
};

export const saveExchangeTrade = async (
    exchangeTrade: ExchangeTrade,
    account: AccountPart,
    date: string,
) => {
    if (!(await isDBAccessible())) return;
    return db.addItem(
        'coinmarketTrades',
        {
            key: exchangeTrade.orderId,
            tradeType: 'exchange',
            date,
            data: exchangeTrade,
            account: {
                descriptor: account.descriptor,
                symbol: account.symbol,
                accountType: account.accountType,
                accountIndex: account.accountIndex,
            },
        },
        undefined,
        true,
    );
};

export const saveDiscovery = async (discoveries: Discovery[]) => {
    if (!(await isDBAccessible())) return;
    return db.addItems('discovery', discoveries, true);
};

export const saveGraph = async (graphData: GraphData[]) => {
    if (!(await isDBAccessible())) return;
    return db.addItems('graph', graphData, true);
};

export const saveAccountTransactions = (account: Account) => async (
    _dispatch: Dispatch,
    getState: GetState,
) => {
    if (!(await isDBAccessible())) return Promise.resolve();
    const allTxs = getState().wallet.transactions.transactions;
    const accTxs = allTxs[account.key] || [];

    // wrap confirmed txs and add its order inside the array
    const orderedTxs = accTxs
        .filter(t => (t.blockHeight || 0) > 0)
        .map((accTx, i) => ({
            tx: accTx,
            order: i,
        }));
    return db.addItems('txs', orderedTxs, true);
};

export const removeAccountGraph = async (account: Account) => {
    if (!(await isDBAccessible())) return;
    return db.removeItemByIndex('graph', 'accountKey', [
        account.descriptor,
        account.symbol,
        account.deviceState,
    ]);
};

export const rememberDevice = (
    device: TrezorDevice,
    remember: boolean,
    forcedRemember?: true,
) => async (dispatch: Dispatch, getState: GetState) => {
    if (!(await isDBAccessible())) return;
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

    const accountPromises = accounts.reduce((promises, account) => {
        return promises.concat([
            dispatch(saveAccountTransactions(account)),
            dispatch(saveAccountDraft(account)),
        ]);
    }, [] as Promise<any>[]);

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
    if (!(await isDBAccessible())) return;
    await db.addItem(
        'walletSettings',
        {
            ...getState().wallet.settings,
        },
        'wallet',
        true,
    );
};

export const removeFiatRate = (symbol: string, tokenAddress?: string) => async (
    _dispatch: Dispatch,
    _getState: GetState,
) => {
    if (!(await isDBAccessible())) return;
    const key = tokenAddress ? `${symbol}-${tokenAddress}` : symbol;
    return db.removeItemByPK('fiatRates', key);
};

export const saveFiatRates = () => async (_dispatch: Dispatch, getState: GetState) => {
    if (!(await isDBAccessible())) return;
    const promises = getState().wallet.fiat.coins.map(c => {
        const key = c.tokenAddress ? `${c.symbol}-${c.tokenAddress}` : c.symbol;
        return db.addItem('fiatRates', c, key, true);
    });
    return Promise.all(promises);
};

export const saveSuiteSettings = () => async (_dispatch: Dispatch, getState: GetState) => {
    if (!(await isDBAccessible())) return;
    const { suite } = getState();
    db.addItem(
        'suiteSettings',
        {
            settings: suite.settings,
            flags: {
                initialRun: suite.flags.initialRun,
                // is not saved at the moment, but probably will be in future. now we always
                // initialWebRun: suite.flag.initialWebRun,
                // TODO: maybe spread all flags and set flags that we don't want to save to undefined?
                discreetModeCompleted: suite.flags.discreetModeCompleted,
                bech32BannerClosed: suite.flags.bech32BannerClosed,
                securityStepsHidden: suite.flags.securityStepsHidden,
                dashboardGraphHidden: suite.flags.dashboardGraphHidden,
            },
        },
        'suite',
        true,
    );
};

export const saveAnalytics = () => async (_dispatch: Dispatch, getState: GetState) => {
    if (!(await isDBAccessible())) return;

    const { analytics } = getState();
    db.addItem(
        'analytics',
        {
            enabled: analytics.enabled,
            instanceId: analytics.instanceId,
        },
        'suite',
        true,
    );
};

/**
 * save general metadata settings
 */
export const saveMetadata = () => async (_dispatch: Dispatch, getState: GetState) => {
    if (!(await isDBAccessible())) return;

    const { metadata } = getState();
    db.addItem(
        'metadata',
        { provider: metadata.provider, enabled: metadata.enabled },
        'state',
        true,
    );
};

export const removeDatabase = () => async (dispatch: Dispatch, getState: GetState) => {
    if (!(await isDBAccessible())) return;

    const rememberedDevices = getState().devices.filter(d => d.remember);
    // forget all remembered devices
    rememberedDevices.forEach(d => {
        suiteActions.rememberDevice(d);
    });
    await db.removeDatabase();
    dispatch(
        notificationActions.addToast({
            type: 'clear-storage',
        }),
    );
};

export const loadSuiteSettings = async () => {
    if (!(await isDBAccessible())) return;
    return db.getItemByPK('suiteSettings', 'suite');
};

export const loadStorage = () => async (dispatch: Dispatch, getState: GetState) => {
    const isDBAvailable = await isDBAccessible();

    if (!isDBAvailable) {
        const initialState = getState();
        dispatch({
            type: STORAGE.LOADED,
            payload: {
                ...initialState,
            },
        });
    } else {
        //  load state from database
        const suite = await loadSuiteSettings();
        const devices = await db.getItemsExtended('devices');
        const accounts = await db.getItemsExtended('accounts');
        const discovery = await db.getItemsExtended('discovery');
        const walletSettings = await db.getItemByPK('walletSettings', 'wallet');
        const fiatRates = await db.getItemsExtended('fiatRates');
        const coinmarketTrades = await db.getItemsExtended('coinmarketTrades');
        const walletGraphData = await db.getItemsExtended('graph');
        const analytics = await db.getItemByPK('analytics', 'suite');
        const metadata = await db.getItemByPK('metadata', 'state');
        const txs = await db.getItemsExtended('txs', 'order');
        const mappedTxs: AppState['wallet']['transactions']['transactions'] = {};

        txs.forEach(item => {
            const k = getAccountKey(item.tx.descriptor, item.tx.symbol, item.tx.deviceState);
            if (!mappedTxs[k]) {
                mappedTxs[k] = [];
            }
            mappedTxs[k][item.order] = item.tx;
        });

        const initialState = getState();

        const sendForm = await db.getItemsWithKeys('sendFormDrafts');
        const drafts: AppState['wallet']['send']['drafts'] = {};
        sendForm.forEach(item => {
            drafts[item.key] = item.value;
        });

        dispatch({
            type: STORAGE.LOADED,
            payload: {
                ...initialState,
                suite: {
                    ...initialState.suite,
                    ...suite,
                    flags: {
                        ...initialState.suite.flags,
                        ...suite?.flags,
                    },
                    settings: {
                        ...initialState.suite.settings,
                        ...suite?.settings,
                        debug: {
                            ...initialState.suite.settings.debug,
                            ...suite?.settings.debug,
                            bridgeDevMode: false, // don't sync bridgeDevMode for now
                        },
                    },
                },
                devices,
                wallet: {
                    ...initialState.wallet,
                    settings: {
                        ...initialState.wallet.settings,
                        ...walletSettings,
                    },
                    accounts,
                    discovery,
                    transactions: {
                        ...initialState.wallet.transactions,
                        transactions: mappedTxs,
                    },
                    fiat: { ...initialState.wallet.fiat, coins: fiatRates || [] },
                    graph: {
                        ...initialState.wallet.graph,
                        data: walletGraphData || [],
                    },
                    coinmarket: {
                        ...initialState.wallet.coinmarket,
                        trades: coinmarketTrades,
                    },
                    send: {
                        ...initialState.wallet.send,
                        drafts,
                    },
                },
                analytics: { ...initialState.analytics, ...analytics },
                metadata: {
                    ...initialState.metadata,
                    ...metadata,
                },
            },
        });
    }
};

export const init = () => async (dispatch: Dispatch) => {
    // should be called only once
    if (await isDBAccessible()) {
        // set callbacks that are fired when upgrading the db is blocked because of multiple instances are running
        db.onBlocked = () => dispatch(suiteActions.setDbError('blocked'));
        db.onBlocking = () => dispatch(suiteActions.setDbError('blocking'));
        await db.getDB();
    }
};
