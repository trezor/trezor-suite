import TrezorConnect from '@trezor/connect';
import type { ScanAccountProgress } from '@trezor/coinjoin/lib/types/backend';
import * as COINJOIN from './constants/coinjoinConstants';
import { goto } from '../suite/routerActions';
import { addToast } from '../suite/notificationActions';
import {
    getCoinjoinServerEnvironment,
    initCoinjoinClient,
    getCoinjoinClient,
    clientDisable,
    analyzeTransactions,
} from './coinjoinClientActions';
import { CoinjoinBackendService } from '@suite/services/coinjoin/coinjoinBackend';
import { CoinjoinClientService } from '@suite/services/coinjoin/coinjoinClient';
import { getRegisterAccountParams, getMaxRounds } from '@wallet-utils/coinjoinUtils';
import { Dispatch, GetState } from '@suite-types';
import { Network } from '@suite-common/wallet-config';
import { Account, CoinjoinSessionParameters } from '@suite-common/wallet-types';
import { accountsActions, transactionsActions } from '@suite-common/wallet-core';
import {
    isAccountOutdated,
    getAccountTransactions,
    sortByBIP44AddressIndex,
} from '@suite-common/wallet-utils';

const coinjoinAccountCreate = (account: Account, targetAnonymity: number) =>
    ({
        type: COINJOIN.ACCOUNT_CREATE,
        payload: {
            account,
            targetAnonymity,
        },
    } as const);

const coinjoinAccountRemove = (accountKey: string) =>
    ({
        type: COINJOIN.ACCOUNT_REMOVE,
        payload: {
            accountKey,
        },
    } as const);

export const coinjoinAccountUpdateAnonymity = (accountKey: string, targetAnonymity: number) =>
    ({
        type: COINJOIN.ACCOUNT_UPDATE_TARGET_ANONYMITY,
        payload: {
            accountKey,
            targetAnonymity,
        },
    } as const);

const coinjoinAccountAuthorize = (accountKey: string) =>
    ({
        type: COINJOIN.ACCOUNT_AUTHORIZE,
        payload: {
            accountKey,
        },
    } as const);

const coinjoinAccountAuthorizeSuccess = (accountKey: string, params: CoinjoinSessionParameters) =>
    ({
        type: COINJOIN.ACCOUNT_AUTHORIZE_SUCCESS,
        payload: {
            accountKey,
            params,
        },
    } as const);

const coinjoinAccountAuthorizeFailed = (accountKey: string, error: string) =>
    ({
        type: COINJOIN.ACCOUNT_AUTHORIZE_FAILED,
        payload: {
            accountKey,
            error,
        },
    } as const);

const coinjoinAccountUnregister = (accountKey: string) =>
    ({
        type: COINJOIN.ACCOUNT_UNREGISTER,
        payload: {
            accountKey,
        },
    } as const);

const coinjoinSessionPause = (accountKey: string) =>
    ({
        type: COINJOIN.SESSION_PAUSE,
        payload: {
            accountKey,
        },
    } as const);

const coinjoinSessionRestore = (accountKey: string) =>
    ({
        type: COINJOIN.SESSION_RESTORE,
        payload: {
            accountKey,
        },
    } as const);

const coinjoinAccountDiscoveryProgress = (account: Account, progress: ScanAccountProgress) =>
    ({
        type: COINJOIN.ACCOUNT_DISCOVERY_PROGRESS,
        payload: {
            account,
            progress,
        },
    } as const);

export type CoinjoinAccountAction =
    | ReturnType<typeof coinjoinAccountCreate>
    | ReturnType<typeof coinjoinAccountRemove>
    | ReturnType<typeof coinjoinAccountUpdateAnonymity>
    | ReturnType<typeof coinjoinAccountAuthorize>
    | ReturnType<typeof coinjoinAccountAuthorizeSuccess>
    | ReturnType<typeof coinjoinAccountAuthorizeFailed>
    | ReturnType<typeof coinjoinAccountUnregister>
    | ReturnType<typeof coinjoinAccountDiscoveryProgress>
    | ReturnType<typeof coinjoinSessionPause>
    | ReturnType<typeof coinjoinSessionRestore>;

const getCheckpoint = (
    account: Extract<Account, { backendType: 'coinjoin' }>,
    getState: GetState,
) => getState().wallet.coinjoin.accounts.find(a => a.key === account.key)?.checkpoint;

const getAccountCache = ({ addresses, path }: Extract<Account, { backendType: 'coinjoin' }>) => {
    if (!addresses) return;
    // used/unused can be alternating, but coinjoin cache needs all receive addrs sorted ascending from 0
    const receiveSorted = sortByBIP44AddressIndex(
        `${path}/0`,
        addresses.used.concat(addresses.unused),
    );
    const receivePrederived = receiveSorted.map(({ address, path }) => ({ address, path }));
    const changePrederived = addresses.change.map(({ address, path }) => ({ address, path }));
    return {
        receivePrederived,
        changePrederived,
    };
};

export const updateClientAccount = (account: Account) => (_: Dispatch, getState: GetState) => {
    const client = getCoinjoinClient(account.symbol);
    if (!client) return;

    const { coinjoin, accounts } = getState().wallet;
    // get fresh data from reducer
    const accountToUpdate = accounts.find(a => a.key === account.key);
    const params = coinjoin.accounts.find(r => r.key === account.key);
    if (!params?.session || !accountToUpdate) return;

    client.updateAccount(getRegisterAccountParams(accountToUpdate, params.session));
};

export const fetchAndUpdateAccount =
    (account: Account) => async (dispatch: Dispatch, getState: GetState) => {
        if (account.backendType !== 'coinjoin' || account.syncing) return;

        const api = CoinjoinBackendService.getInstance(account.symbol);
        if (!api) return;

        const isInitialUpdate = account.status !== 'ready';
        dispatch(accountsActions.startCoinjoinAccountSync(account));

        const onProgress = (progress: ScanAccountProgress) => {
            if (progress.transactions.length) {
                dispatch(
                    transactionsActions.addTransaction({
                        account,
                        transactions: progress.transactions,
                    }),
                );
            }
            dispatch(coinjoinAccountDiscoveryProgress(account, progress));
        };

        try {
            api.on(`progress/${account.descriptor}`, onProgress);

            const { pending, checkpoint, cache } = await api.scanAccount({
                descriptor: account.descriptor,
                checkpoint: getCheckpoint(account, getState),
                cache: getAccountCache(account),
            });

            onProgress({ checkpoint, transactions: pending });

            const transactions = getAccountTransactions(
                account.key,
                getState().wallet.transactions.transactions,
            );

            const accountInfo = await api.getAccountInfo(
                account.descriptor,
                transactions,
                checkpoint,
                cache,
            );
            // TODO accountInfo.utxo don't have proper utxo.confirmations field, only 0/1

            // TODO add isPending check?
            if (isAccountOutdated(account, accountInfo) || isInitialUpdate) {
                // calculate account anonymity set in CoinjoinClient
                const accountInfoWithAnonymitySet = await dispatch(
                    analyzeTransactions(accountInfo, account.symbol),
                );

                dispatch(accountsActions.updateAccount(account, accountInfoWithAnonymitySet));

                // update account in CoinjoinClient
                dispatch(updateClientAccount(account));
            }

            // TODO remove invalid transactions

            // TODO notify about new transactions

            dispatch(accountsActions.endCoinjoinAccountSync(account, 'ready'));
        } catch (error) {
            dispatch(
                accountsActions.endCoinjoinAccountSync(
                    account,
                    isInitialUpdate ? 'error' : 'ready',
                ),
            );
        } finally {
            api.off(`progress/${account.descriptor}`, onProgress);
        }
    };

export const createCoinjoinAccount =
    (network: Network, targetAnonymity: number) =>
    async (dispatch: Dispatch, getState: GetState) => {
        if (network.accountType !== 'coinjoin') {
            throw new Error('createCoinjoinAccount: invalid account type');
        }

        const coinjoinServerEnvironment = dispatch(getCoinjoinServerEnvironment(network.symbol));

        // initialize @trezor/coinjoin client
        const client = await dispatch(
            initCoinjoinClient(network.symbol, coinjoinServerEnvironment),
        );
        if (!client) {
            return;
        }

        // initialize @trezor/coinjoin backend
        if (!CoinjoinBackendService.getInstance(network.symbol)) {
            await CoinjoinBackendService.createInstance(network.symbol, coinjoinServerEnvironment);
        }

        const { device } = getState().suite;
        const unlockPath = await TrezorConnect.unlockPath({
            path: "m/10025'",
            device,
            useEmptyPassphrase: device?.useEmptyPassphrase,
        });
        if (!unlockPath.success) {
            dispatch(
                addToast({
                    type: 'error',
                    error: unlockPath.payload.error,
                }),
            );
            return;
        }

        const path = network.bip43Path.replace('i', '0');

        // get coinjoin account xpub
        const publicKey = await TrezorConnect.getPublicKey({
            path,
            unlockPath: unlockPath.payload,
            device,
            useEmptyPassphrase: device?.useEmptyPassphrase,
            coin: network.symbol,
        });
        if (!publicKey.success) {
            dispatch(
                addToast({
                    type: 'error',
                    error: publicKey.payload.error,
                }),
            );
            return;
        }

        // create empty account
        const account = dispatch(
            accountsActions.createAccount(
                device!.state!,
                {
                    index: 0,
                    path,
                    unlockPath: unlockPath.payload,
                    accountType: network.accountType,
                    networkType: network.networkType,
                    backendType: 'coinjoin',
                    coin: network.symbol,
                    derivationType: 0,
                    status: 'initial',
                },
                {
                    addresses: { change: [], used: [], unused: [] },
                    availableBalance: '0',
                    balance: '0',
                    descriptor: publicKey.payload.xpubSegwit || publicKey.payload.xpub,
                    empty: true,
                    history: { total: 0, unconfirmed: 0 },
                    legacyXpub: publicKey.payload.xpub,
                    page: { index: 1, size: 25, total: 1 },
                    utxo: [],
                },
            ),
        );
        dispatch(coinjoinAccountCreate(account.payload, targetAnonymity));

        // switch to account
        dispatch(
            goto('wallet-index', {
                params: {
                    symbol: network.symbol,
                    accountType: network.accountType,
                    accountIndex: 0,
                },
            }),
        );

        // start discovery
        dispatch(fetchAndUpdateAccount(account.payload));
    };

const authorizeCoinjoin =
    (account: Account, params: CoinjoinSessionParameters & { coordinator: string }) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const { device } = getState().suite;

        // authorize coinjoin session on Trezor
        dispatch(coinjoinAccountAuthorize(account.key));

        const auth = await TrezorConnect.authorizeCoinJoin({
            device,
            useEmptyPassphrase: device?.useEmptyPassphrase,
            path: account.path,
            coin: account.symbol,
            ...params,
        });

        if (auth.success) {
            dispatch(coinjoinAccountAuthorizeSuccess(account.key, params));
            return true;
        }

        dispatch(coinjoinAccountAuthorizeFailed(account.key, auth.payload.error));

        dispatch(
            addToast({
                type: 'error',
                error: `Coinjoin not authorized: ${auth.payload.error}`,
            }),
        );
    };

// called from coinjoin account UI
export const startCoinjoinSession =
    (account: Account, params: CoinjoinSessionParameters) => async (dispatch: Dispatch) => {
        if (account.accountType !== 'coinjoin') {
            throw new Error('startCoinjoinSession: invalid account type');
        }

        // initialize @trezor/coinjoin client
        const coinjoinServerEnvironment = dispatch(getCoinjoinServerEnvironment(account.symbol));
        const client = await dispatch(
            initCoinjoinClient(account.symbol, coinjoinServerEnvironment),
        );

        if (!client) {
            return;
        }

        // authorize CoinjoinSession on Trezor
        const authResult = await dispatch(
            authorizeCoinjoin(account, {
                ...params,
                coordinator: client.settings.coordinatorName,
            }),
        );

        if (authResult) {
            // register authorized account
            client.registerAccount(getRegisterAccountParams(account, params));
            // switch to account
            dispatch(goto('wallet-index', { preserveParams: true }));
        }
    };

// called from coinjoin account UI or exceptions like device disconnection, forget wallet/account etc.
export const pauseCoinjoinSession = (account: Account) => (dispatch: Dispatch) => {
    // get @trezor/coinjoin client if available
    const client = getCoinjoinClient(account.symbol);

    // unregister account in @trezor/coinjoin
    client?.unregisterAccount(account.key);

    // dispatch data to reducer
    dispatch(coinjoinSessionPause(account.key));
};

// called from coinjoin account UI
// try to restore current paused CoinjoinSession
// use same parameters as in startCoinjoinSession but recalculate maxRounds value
// if Trezor is already preauthorized it will not ask for confirmation
export const restoreCoinjoinSession =
    (account: Account) => async (dispatch: Dispatch, getState: GetState) => {
        // TODO: check if device is connected, passphrase is authorized...
        const { device } = getState().suite;
        const { coinjoin } = getState().wallet;

        // get @trezor/coinjoin client if available
        const client = getCoinjoinClient(account.symbol);
        // get fresh data from reducer
        const coinjoinAccount = coinjoin.accounts.find(a => a.key === account.key);
        if (!device || !coinjoinAccount || !coinjoinAccount.session || !client) {
            dispatch(
                addToast({
                    type: 'error',
                    error: `Coinjoin not authorized: missing data`,
                }),
            );
            return;
        }

        const { session } = coinjoinAccount;

        // recalculate maxRounds
        const maxRounds = getMaxRounds(
            coinjoinAccount.targetAnonymity,
            account.addresses?.anonymitySet || {},
        );

        if (maxRounds !== session.maxRounds) {
            // TODO: decision should Trezor ask for confirmation if it's already preauthorized but maxRounds changed? should it updated in CoinjoinSession?
        }

        const auth = await TrezorConnect.authorizeCoinJoin({
            device,
            useEmptyPassphrase: device?.useEmptyPassphrase,
            path: account.path,
            coin: account.symbol,
            preauthorized: true, // this parameter will check if device is already authorized
            // reuse session params
            coordinator: client.settings.coordinatorName,
            maxCoordinatorFeeRate: session.maxCoordinatorFeeRate,
            maxFeePerKvbyte: session.maxFeePerKvbyte,
            maxRounds,
        });

        if (auth.success) {
            // dispatch data to reducer
            dispatch(coinjoinSessionRestore(account.key)); // todo: pass new max rounds
            // register authorized account
            client.registerAccount(getRegisterAccountParams(account, session));
        } else {
            dispatch(
                addToast({
                    type: 'error',
                    error: `Coinjoin not authorized: ${auth.payload.error}`,
                }),
            );
        }
    };

// called from coinjoin account UI or exceptions like device disconnection, forget wallet/account etc.
export const stopCoinjoinSession = (account: Account) => (dispatch: Dispatch) => {
    // get @trezor/coinjoin client if available
    const client = getCoinjoinClient(account.symbol);
    if (!client) {
        return;
    }

    // unregister account in @trezor/coinjoin
    client.unregisterAccount(account.key);

    // dispatch data to reducer
    dispatch(coinjoinAccountUnregister(account.key));
};

export const forgetCoinjoinAccounts =
    (accounts: Account[]) => (dispatch: Dispatch, getState: GetState) => {
        const { coinjoin } = getState().wallet;
        // find all accounts to unregister
        const coinjoinNetworks = coinjoin.accounts.reduce((res, cjAccount) => {
            const account = accounts.find(a => a.key === cjAccount.key);
            if (account) {
                if (cjAccount.session) {
                    dispatch(stopCoinjoinSession(account));
                }
                dispatch(coinjoinAccountRemove(cjAccount.key));
                if (!res.includes(cjAccount.symbol)) {
                    return res.concat(cjAccount.symbol);
                }
            }
            return res;
        }, [] as Account['symbol'][]);

        // get new state
        const otherCjAccounts = getState().wallet.coinjoin.accounts;
        coinjoinNetworks.forEach(network => {
            const other = otherCjAccounts.find(a => a.symbol === network);
            // clear CoinjoinClientInstance if there are no related accounts left
            if (!other) {
                dispatch(clientDisable(network));
                CoinjoinBackendService.removeInstance(network);
                CoinjoinClientService.removeInstance(network);
            }
        });
    };

export const restoreCoinjoin = () => (dispatch: Dispatch, getState: GetState) => {
    const { accounts, coinjoin } = getState().wallet;

    // find all networks to restore
    const coinjoinNetworks = coinjoin.accounts.reduce((res, cjAccount) => {
        const account = accounts.find(a => a.key === cjAccount.key);
        if (account) {
            // currently it is not possible to full restore session while using passphrase.
            // related to @trezor/connect and inner-outer state
            if (cjAccount.session) {
                dispatch(pauseCoinjoinSession(account));
            }

            if (!res.includes(account.symbol)) {
                return res.concat(account.symbol);
            }
        }
        return res;
    }, [] as Account['symbol'][]);

    // async actions in sequence
    // TODO: handle client init error and do not proceed after first failure
    return coinjoinNetworks.reduce(
        (p, symbol) =>
            p.then(async () => {
                const coinjoinServerEnvironment = dispatch(getCoinjoinServerEnvironment(symbol));
                // initialize @trezor/coinjoin backend
                await CoinjoinBackendService.createInstance(symbol, coinjoinServerEnvironment);
                // initialize @trezor/coinjoin client
                await dispatch(initCoinjoinClient(symbol, coinjoinServerEnvironment));
            }),
        Promise.resolve(),
    );
};
