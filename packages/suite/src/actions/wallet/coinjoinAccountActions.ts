import TrezorConnect from '@trezor/connect';
import * as COINJOIN from './constants/coinjoinConstants';
import { goto } from '../suite/routerActions';
import { addToast } from '../suite/notificationActions';
import { initCoinjoinClient, getCoinjoinClient } from './coinjoinClientActions';
import { CoinjoinBackendService } from '@suite/services/coinjoin/coinjoinBackend';
import { Dispatch, GetState } from '@suite-types';
import { Network } from '@suite-common/wallet-config';
import { Account, CoinjoinSessionParameters } from '@suite-common/wallet-types';
import { accountsActions, transactionsActions } from '@suite-common/wallet-core';
import {
    isAccountOutdated,
    analyzeTransactions,
    getAccountTransactions,
    getOriginalTransaction,
} from '@suite-common/wallet-utils';

const coinjoinAccountCreate = (account: Account) =>
    ({
        type: COINJOIN.ACCOUNT_CREATE,
        account,
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

export type CoinjoinAccountAction =
    | ReturnType<typeof coinjoinAccountCreate>
    | ReturnType<typeof coinjoinAccountAuthorize>
    | ReturnType<typeof coinjoinAccountAuthorizeSuccess>
    | ReturnType<typeof coinjoinAccountAuthorizeFailed>
    | ReturnType<typeof coinjoinAccountUnregister>;

const getKnownState = (
    account: Extract<Account, { backendType: 'coinjoin' }>,
    getState: GetState,
) =>
    account.discoveryCheckpoint && {
        blockHash: account.discoveryCheckpoint.blockHash,
        receiveCount: account.addresses
            ? account.addresses.unused.length + account.addresses.used.length
            : 0,
        changeCount: account.addresses?.change.length ?? 0,
        transactions: getAccountTransactions(
            account.key,
            getState().wallet.transactions.transactions,
        ).map(getOriginalTransaction),
    };

export const fetchAndUpdateAccount =
    (account: Account) => async (dispatch: Dispatch, getState: GetState) => {
        if (account.backendType !== 'coinjoin' || account.discoveryStatus === 'syncing') return;

        const knownState = getKnownState(account, getState);

        try {
            const api = CoinjoinBackendService.getInstance(account.symbol);
            if (!api) throw new Error('CoinjoinBackendService api not found');

            const { checkpoint, ...accountInfo } = await api.getAccountInfo({
                descriptor: account.descriptor,
                knownState,
            });

            // TODO add isPending check?
            if (!isAccountOutdated(account, accountInfo)) {
                if (account.discoveryStatus === 'initial') {
                    dispatch(
                        accountsActions.updateAccount({ ...account, discoveryStatus: 'ready' }),
                    );
                }
                return;
            }

            const analyze = analyzeTransactions(
                accountInfo.history.transactions || [],
                knownState?.transactions || [],
            );

            if (analyze.remove.length > 0) {
                dispatch(transactionsActions.removeTransaction({ txs: analyze.remove, account }));
            }
            if (analyze.add.length > 0) {
                dispatch(
                    transactionsActions.addTransaction({
                        transactions: analyze.add.reverse(),
                        account,
                    }),
                );
            }

            // TODO notify about analyze.newTransactions

            // get fresh info from reducer
            const updatedAccount = getState().wallet.accounts.find(a => a.key === account.key);
            if (updatedAccount?.backendType === 'coinjoin') {
                // finalize
                dispatch(
                    accountsActions.updateAccount(
                        {
                            ...updatedAccount,
                            discoveryStatus: 'ready',
                            discoveryCheckpoint: checkpoint,
                        },
                        accountInfo,
                    ),
                );
            }
        } catch (error) {
            // TODO
            console.warn('fetchAndUpdateAccount', error);
        }
    };

export const createCoinjoinAccount =
    (network: Network) => async (dispatch: Dispatch, getState: GetState) => {
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

        // TODO: Disable safety_checks until Trezor FW will implement slip-0025
        // const safety =
        //     device?.features?.safety_checks !== 'PromptTemporarily'
        //         ? 'PromptTemporarily'
        //         : undefined;
        const experimentalFeatures = await TrezorConnect.applySettings({
            device,
            experimental_features: true,
            // safety_checks: safety,
        });
        if (!experimentalFeatures.success) {
            dispatch(addToast({ type: 'error', error: 'Experimental features not enabled' }));
            return;
        }

        // temporary hardcoded until Trezor FW will implement slip-0025
        const PATH = `m/86'/1'/25'`; // `m/10025'/1'/0'`  network.bip43Path

        // get coinjoin account xpub
        const publicKey = await TrezorConnect.getPublicKey({
            device,
            useEmptyPassphrase: device?.useEmptyPassphrase,
            path: PATH,
            coin: network.symbol,
        });
        if (!publicKey.success) {
            dispatch(addToast({ type: 'error', error: 'Public key not given' }));
            return;
        }

        // create empty account
        const account = dispatch(
            accountsActions.createAccount(
                device!.state!,
                {
                    index: 0,
                    path: PATH,
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
        dispatch(coinjoinAccountCreate(account.payload));

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

        // register authorized account
        if (authResult) {
            client.registerAccount(account);
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
