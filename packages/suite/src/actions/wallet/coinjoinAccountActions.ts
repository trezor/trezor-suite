import TrezorConnect from '@trezor/connect';
import type { ScanAccountProgress } from '@trezor/coinjoin/src/backend/types';
import * as COINJOIN from './constants/coinjoinConstants';
import { goto } from '../suite/routerActions';
import { addToast } from '../suite/notificationActions';
import { initCoinjoinClient, getCoinjoinClient } from './coinjoinClientActions';
import { CoinjoinBackendService } from '@suite/services/coinjoin/coinjoinBackend';
import { Dispatch, GetState } from '@suite-types';
import { Network } from '@suite-common/wallet-config';
import { Account, CoinjoinSessionParameters } from '@suite-common/wallet-types';
import { accountsActions, transactionsActions } from '@suite-common/wallet-core';
import { isAccountOutdated, getAccountTransactions } from '@suite-common/wallet-utils';

const coinjoinAccountCreate = (account: Account, targetAnonymity: number) =>
    ({
        type: COINJOIN.ACCOUNT_CREATE,
        account,
        targetAnonymity,
    } as const);

const coinjoinAccountUpdateAnonymity = (key: string, targetAnonymity: number) =>
    ({
        type: COINJOIN.ACCOUNT_UPDATE_TARGET_ANONYMITY,
        key,
        targetAnonymity,
    } as const);

const coinjoinAccountAuthorize = (account: Account) =>
    ({
        type: COINJOIN.ACCOUNT_AUTHORIZE,
        account,
    } as const);

const coinjoinAccountAuthorizeSuccess = (account: Account, params: CoinjoinSessionParameters) =>
    ({
        type: COINJOIN.ACCOUNT_AUTHORIZE_SUCCESS,
        account,
        params,
    } as const);

const coinjoinAccountAuthorizeFailed = (account: Account, error: string) =>
    ({
        type: COINJOIN.ACCOUNT_AUTHORIZE_FAILED,
        account,
        error,
    } as const);

const coinjoinAccountUnregister = (account: Account) =>
    ({
        type: COINJOIN.ACCOUNT_UNREGISTER,
        account,
    } as const);

const coinjoinAccountDiscoveryProgress = (account: Account, progress: ScanAccountProgress) =>
    ({
        type: COINJOIN.ACCOUNT_DISCOVERY_PROGRESS,
        account,
        progress,
    } as const);

export type CoinjoinAccountAction =
    | ReturnType<typeof coinjoinAccountCreate>
    | ReturnType<typeof coinjoinAccountUpdateAnonymity>
    | ReturnType<typeof coinjoinAccountAuthorize>
    | ReturnType<typeof coinjoinAccountAuthorizeSuccess>
    | ReturnType<typeof coinjoinAccountAuthorizeFailed>
    | ReturnType<typeof coinjoinAccountUnregister>
    | ReturnType<typeof coinjoinAccountDiscoveryProgress>;

const getCheckpoint = (
    account: Extract<Account, { backendType: 'coinjoin' }>,
    getState: GetState,
) => getState().wallet.coinjoin.accounts.find(a => a.key === account.key)?.checkpoint;

export const fetchAndUpdateAccount =
    (account: Account) => async (dispatch: Dispatch, getState: GetState) => {
        if (account.backendType !== 'coinjoin' || account.discoveryStatus === 'syncing') return;

        const isInitialUpdate = account.discoveryStatus !== 'ready';
        dispatch(accountsActions.updateCoinjoinAccountStatus(account, 'syncing'));

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

        const api = CoinjoinBackendService.getInstance(account.symbol);
        if (!api) throw new Error('CoinjoinBackendService api not found');

        try {
            api.on('progress', onProgress);

            const { pending, checkpoint } = await api.scanAccount({
                descriptor: account.descriptor,
                checkpoint: getCheckpoint(account, getState),
            });

            onProgress({ checkpoint, transactions: pending });

            const transactions = getAccountTransactions(
                account.key,
                getState().wallet.transactions.transactions,
            );

            const accountInfo = api.getAccountInfo(account.descriptor, transactions, checkpoint);
            // TODO accountInfo.utxo don't have proper utxo.confirmations field, only 0/1

            // TODO add isPending check?
            if (isAccountOutdated(account, accountInfo) || isInitialUpdate) {
                dispatch(accountsActions.updateAccount(account, accountInfo));
            }

            // TODO remove invalid transactions

            // TODO notify about new transactions

            dispatch(accountsActions.updateCoinjoinAccountStatus(account, 'ready'));
        } catch (error) {
            console.warn('fetchAndUpdateAccount', error);
            dispatch(
                accountsActions.updateCoinjoinAccountStatus(
                    account,
                    isInitialUpdate ? 'error' : 'ready',
                ),
            );
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
                    discoveryStatus: 'initial',
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
        dispatch(coinjoinAccountAuthorize(account));

        const auth = await TrezorConnect.authorizeCoinJoin({
            device,
            useEmptyPassphrase: device?.useEmptyPassphrase,
            path: account.path,
            coin: account.symbol,
            ...params,
        });

        if (auth.success) {
            dispatch(coinjoinAccountAuthorizeSuccess(account, params));
            return true;
        }

        dispatch(coinjoinAccountAuthorizeFailed(account, auth.payload.error));

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
    dispatch(coinjoinAccountUnregister(account));
};
