import TrezorConnect from '@trezor/connect';
import * as COINJOIN from './constants/coinjoinConstants';
import { goto } from '../suite/routerActions';
import { addToast } from '../suite/notificationActions';
import { initCoinjoinClient, getCoinjoinClient, clientDisable } from './coinjoinClientActions';
import { CoinjoinBackendService } from '@suite/services/coinjoin/coinjoinBackend';
import { CoinjoinClientService } from '@suite/services/coinjoin/coinjoinClient';
import { Dispatch, GetState } from '@suite-types';
import { Network } from '@suite-common/wallet-config';
import { Account, CoinjoinSessionParameters } from '@suite-common/wallet-types';
import { accountsActions, transactionsActions } from '@suite-common/wallet-core';

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

const coinjoinAccountUpdateAnonymity = (accountKey: string, targetAnonymity: number) =>
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

export type CoinjoinAccountAction =
    | ReturnType<typeof coinjoinAccountCreate>
    | ReturnType<typeof coinjoinAccountRemove>
    | ReturnType<typeof coinjoinAccountUpdateAnonymity>
    | ReturnType<typeof coinjoinAccountAuthorize>
    | ReturnType<typeof coinjoinAccountAuthorizeSuccess>
    | ReturnType<typeof coinjoinAccountAuthorizeFailed>
    | ReturnType<typeof coinjoinAccountUnregister>;

export const fetchAndUpdateAccount =
    (account: Account) => async (dispatch: Dispatch, getState: GetState) => {
        if (account.backendType !== 'coinjoin') return;

        const lastKnownState = {
            time: Date.now(),
            blockHash: account.lastKnownState?.blockHash || '',
            progress: 0,
        };

        const onProgress = (progressState: any) => {
            dispatch(
                accountsActions.updateAccount({
                    ...account,
                    lastKnownState: {
                        ...progressState,
                        time: Date.now(),
                    },
                }),
            );
        };

        const api = CoinjoinBackendService.getInstance(account.symbol);
        if (!api) throw new Error('CoinjoinBackendService api not found');

        try {
            api.on('progress', onProgress);
            // @ts-expect-error, method is...
            const accountInfo: any = await api.getAccountInfo({
                descriptor: account.descriptor,
                lastKnownState: {
                    balance: account.balance,
                    blockHash: lastKnownState.blockHash,
                },
                symbol: account.symbol,
            });

            if (accountInfo) {
                // get fresh info from reducer
                const updatedAccount = getState().wallet.accounts.find(a => a.key === account.key);
                if (updatedAccount && updatedAccount.lastKnownState) {
                    // finalize
                    dispatch(
                        accountsActions.updateAccount(
                            {
                                ...updatedAccount,
                                lastKnownState: {
                                    time: Date.now(),
                                    blockHash: updatedAccount.lastKnownState.blockHash,
                                },
                            },
                            accountInfo,
                        ),
                    );
                    // add account transactions
                    if (accountInfo.history.transactions) {
                        dispatch(
                            transactionsActions.addTransaction({
                                transactions: accountInfo.history.transactions,
                                account,
                            }),
                        );
                    }
                }
            } else {
                // TODO: no accountInfo
            }
        } catch (error) {
            // TODO
            console.warn('fetchAndUpdateAccount', error);
        } finally {
            api.off('progress', onProgress);
        }
    };

export const createCoinjoinAccount =
    (network: Network, targetAnonymity: number) =>
    async (dispatch: Dispatch, getState: GetState) => {
        if (network.accountType !== 'coinjoin') {
            throw new Error('createCoinjoinAccount: invalid account type');
        }

        // initialize @trezor/coinjoin backend
        if (!CoinjoinBackendService.getInstance(network.symbol)) {
            await CoinjoinBackendService.createInstance(network.symbol);
        }

        // initialize @trezor/coinjoin client
        const client = await dispatch(initCoinjoinClient(network.symbol));
        if (!client) {
            return;
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
                    lastKnownState: {
                        time: 0,
                        blockHash: '',
                        progress: 0,
                    },
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
        // initialize @trezor/coinjoin client
        const client = await dispatch(initCoinjoinClient(account.symbol));
        if (!client) {
            return;
        }

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
        const client = await dispatch(initCoinjoinClient(account.symbol));
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
            client.registerAccount(account);
            // switch to account
            dispatch(goto('wallet-index', { preserveParams: true }));
        }
    };

// called from coinjoin account UI or exceptions like device disconnection, forget wallet/account etc.
export const stopCoinjoinSession = (account: Account) => (dispatch: Dispatch) => {
    // get @trezor/coinjoin client if available
    const client = dispatch(getCoinjoinClient(account.symbol));
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
