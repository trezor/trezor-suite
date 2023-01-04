import TrezorConnect from '@trezor/connect';
import { ScanAccountProgress, BroadcastedTransactionDetails } from '@trezor/coinjoin';
import { promiseAllSequence } from '@trezor/utils';

import { SUITE } from '@suite-actions/constants';
import * as COINJOIN from './constants/coinjoinConstants';
import { goto } from '../suite/routerActions';
import { notificationsActions } from '@suite-common/toast-notifications';
import * as coinjoinClientActions from './coinjoinClientActions';
import { CoinjoinService, COORDINATOR_FEE_RATE_MULTIPLIER } from '@suite/services/coinjoin';
import { getAccountProgressHandle, getRegisterAccountParams } from '@wallet-utils/coinjoinUtils';
import { Dispatch, GetState } from '@suite-types';
import { Network, NetworkSymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import { CoinjoinAccount, CoinjoinSessionParameters } from '@wallet-types/coinjoin';
import {
    accountsActions,
    selectAccountByKey,
    transactionsActions,
} from '@suite-common/wallet-core';
import {
    selectCoinjoinAccounts,
    selectCoinjoinAccountByKey,
    selectCoinjoinSessionBlockerByAccountKey,
    selectIsAccountWithSessionByAccountKey,
    selectIsAccountWithSessionInCriticalPhaseByAccountKey,
    selectIsAnySessionInCriticalPhase,
    selectHasAnonymitySetError,
    selectIsNothingToAnonymizeByAccountKey,
} from '@wallet-reducers/coinjoinReducer';
import { getAccountTransactions, sortByBIP44AddressIndex } from '@suite-common/wallet-utils';
import { openModal } from '@suite-actions/modalActions';

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

export const coinjoinAccountSetLiquidityClue = (
    accountKey: string,
    rawLiquidityClue: CoinjoinAccount['rawLiquidityClue'],
) =>
    ({
        type: COINJOIN.ACCOUNT_SET_LIQUIDITY_CLUE,
        payload: {
            accountKey,
            rawLiquidityClue,
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

const coinjoinAccountPreloading = (isPreloading: boolean) =>
    ({
        type: COINJOIN.ACCOUNT_PRELOADING,
        payload: {
            isPreloading,
        },
    } as const);

const coinjoinSessionPause = (accountKey: string, interrupted: boolean) =>
    ({
        type: COINJOIN.SESSION_PAUSE,
        payload: {
            accountKey,
            interrupted,
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

const coinjoinSessionStarting = (accountKey: string, isStarting: boolean) =>
    ({
        type: COINJOIN.SESSION_STARTING,
        payload: {
            accountKey,
            isStarting,
        },
    } as const);

export const updateCoinjoinConfig = ({
    averageAnonymityGainPerRound,
    roundsFailRateBuffer,
    roundsDurationInHours,
}: {
    averageAnonymityGainPerRound: number;
    roundsFailRateBuffer: number;
    roundsDurationInHours: number;
}) =>
    ({
        type: COINJOIN.UPDATE_CONFIG,
        payload: {
            averageAnonymityGainPerRound,
            roundsFailRateBuffer,
            roundsDurationInHours,
        },
    } as const);

export type CoinjoinAccountAction =
    | ReturnType<typeof coinjoinAccountCreate>
    | ReturnType<typeof coinjoinAccountRemove>
    | ReturnType<typeof coinjoinAccountUpdateAnonymity>
    | ReturnType<typeof coinjoinAccountSetLiquidityClue>
    | ReturnType<typeof coinjoinAccountAuthorize>
    | ReturnType<typeof coinjoinAccountAuthorizeSuccess>
    | ReturnType<typeof coinjoinAccountAuthorizeFailed>
    | ReturnType<typeof coinjoinAccountUnregister>
    | ReturnType<typeof coinjoinAccountDiscoveryProgress>
    | ReturnType<typeof updateCoinjoinConfig>
    | ReturnType<typeof coinjoinAccountPreloading>
    | ReturnType<typeof coinjoinSessionPause>
    | ReturnType<typeof coinjoinSessionRestore>
    | ReturnType<typeof coinjoinSessionStarting>;

const getCheckpoints = (
    account: Extract<Account, { backendType: 'coinjoin' }>,
    getState: GetState,
) => selectCoinjoinAccountByKey(getState(), account.key)?.checkpoints;

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

export const updateClientAccount =
    (account: Account) => (dispatch: Dispatch, getState: GetState) => {
        const client = coinjoinClientActions.getCoinjoinClient(account.symbol);
        if (!client) return;

        const state = getState();
        // get fresh data from reducer
        const accountToUpdate = selectAccountByKey(state, account.key);
        const coinjoinAccount = selectCoinjoinAccountByKey(state, account.key);
        if (!coinjoinAccount?.session || !accountToUpdate) return;
        const { session, rawLiquidityClue } = coinjoinAccount;

        client.updateAccount(getRegisterAccountParams(accountToUpdate, session, rawLiquidityClue));

        // End coinjoin session if anonymity has been reached.
        const hasSession = selectIsAccountWithSessionByAccountKey(state, account.key);
        const reachedAnonymityInCurrentSession =
            hasSession && selectIsNothingToAnonymizeByAccountKey(state, account.key);
        if (reachedAnonymityInCurrentSession) {
            dispatch(coinjoinClientActions.endCoinjoinSession(account.key));
            // In an edge case when multiple coinjoin sessions finish in the same round, the result modal is shown only for one of them.
            // Nice to have TODO: display results per account in one modal.
            if (!('payload' in state.modal && state.modal.payload.type === 'coinjoin-success')) {
                dispatch(
                    openModal({
                        type: 'coinjoin-success',
                        relatedAccountKey: account.key,
                    }),
                );
            }
        }
    };

const coinjoinAccountCheckReorg =
    (account: Account, checkpoint: ScanAccountProgress['checkpoint']) =>
    (dispatch: Dispatch, getState: GetState) => {
        const state = getState();
        const previousCheckpoint = selectCoinjoinAccountByKey(state, account.key)?.checkpoints?.[0];
        if (previousCheckpoint && checkpoint.blockHeight < previousCheckpoint.blockHeight) {
            const txs = getAccountTransactions(
                account.key,
                state.wallet.transactions.transactions,
            ).filter(
                ({ blockHeight }) =>
                    !blockHeight || blockHeight >= checkpoint.blockHeight || blockHeight < 0,
            );
            dispatch(transactionsActions.removeTransaction({ account, txs }));
        }
    };

const coinjoinAccountAddTransactions =
    (props: Parameters<typeof transactionsActions.addTransaction>[0]) => (dispatch: Dispatch) => {
        if (props.transactions.length > 0) {
            dispatch(transactionsActions.addTransaction(props));
        }
    };

/**
Action called from coinjoinMiddleware as reaction to prepending tx creation.
Prepending tx could be created either as result of successful CoinjoinRound (not broadcasted by suite)
or as result of sendFormActions > addFakePendingTxThunk (broadcasted by suite)
in both cases Account should:
- exclude spent utxo
- mark addresses as used
- recalculate anonymity
- recalculate balance
prepending txs have deadline (blockHeight) when they should be removed from UI
 */
export const updatePendingAccountInfo =
    (accountKey: string) => async (dispatch: Dispatch, getState: GetState) => {
        const state = getState();
        const account = selectAccountByKey(state, accountKey);
        const coinjoinAccount = selectCoinjoinAccountByKey(state, accountKey);
        if (account?.backendType !== 'coinjoin' || !coinjoinAccount?.checkpoints) return;

        const api = await dispatch(coinjoinClientActions.initCoinjoinService(account.symbol));
        if (!api) return;

        const { backend, client } = api;
        const transactions = state.wallet.transactions.transactions[account.key];

        const accountInfo = await backend.getAccountInfo(
            account.descriptor,
            transactions,
            coinjoinAccount.checkpoints[0],
            getAccountCache(account),
        );

        const { anonymityScores } = await client.analyzeTransactions(
            accountInfo.history.transactions,
            ['anonymityScores'],
        );
        accountInfo.addresses.anonymitySet = anonymityScores;

        dispatch(accountsActions.updateAccount(account, accountInfo));
    };

export const createPendingTransaction =
    (accountKey: string, payload: BroadcastedTransactionDetails) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const state = getState();
        const account = selectAccountByKey(state, accountKey);
        const coinjoinAccount = selectCoinjoinAccountByKey(state, accountKey);
        if (account?.backendType !== 'coinjoin' || !coinjoinAccount?.checkpoints) return;

        const api = await dispatch(coinjoinClientActions.initCoinjoinService(account.symbol));
        if (!api) return;

        const { backend } = api;

        // deadline = pending tx not found in mempool after two mined blocks
        const pending = await backend.createPendingTransaction(account, payload);
        const deadline = state.wallet.blockchain[account.symbol].blockHeight + 2;
        dispatch(
            coinjoinAccountAddTransactions({
                account,
                transactions: [{ ...pending, deadline }],
            }),
        );
    };

export const fetchAndUpdateAccount =
    (account: Account) => async (dispatch: Dispatch, getState: GetState) => {
        if (account.backendType !== 'coinjoin' || account.syncing) return;
        const state = getState();
        // do not sync if any account CoinjoinSession is in critical phase
        if (selectIsAnySessionInCriticalPhase(state)) return;

        const api = await dispatch(coinjoinClientActions.initCoinjoinService(account.symbol));
        if (!api) return;

        const { backend, client } = api;
        const isInitialUpdate = account.status === 'initial' || account.status === 'error';
        dispatch(accountsActions.startCoinjoinAccountSync(account));

        const onProgress = (progress: ScanAccountProgress) => {
            // removes transactions if current checkpoint precedes latest stored checkpoint
            dispatch(coinjoinAccountCheckReorg(account, progress.checkpoint));
            // add discovered transactions (if any)
            dispatch(
                coinjoinAccountAddTransactions({ account, transactions: progress.transactions }),
            );
            // store current checkpoint (and all account data to db if remembered)
            dispatch(coinjoinAccountDiscoveryProgress(account, progress));
        };

        const progressHandle = getAccountProgressHandle(account);

        try {
            backend.on(`progress/${progressHandle}`, onProgress);

            const prevTransactions = state.wallet.transactions.transactions[account.key];

            const { pending, checkpoint, cache } = await backend.scanAccount({
                descriptor: account.descriptor,
                checkpoints: getCheckpoints(account, getState),
                cache: getAccountCache(account),
                progressHandle,
            });

            // Remove prepending transactions with outdated deadline or present in scanAccount response
            const prepending = prevTransactions
                ? prevTransactions.filter(tx => 'deadline' in tx)
                : [];
            if (prepending.length > 0) {
                const { blockHeight } = state.wallet.blockchain[account.symbol];
                const prependingToRemove = prepending.filter(
                    tx => tx.deadline! < blockHeight || pending.some(tx2 => tx2.txid === tx.txid),
                );
                if (prependingToRemove.length > 0) {
                    dispatch(
                        transactionsActions.removeTransaction({ account, txs: prependingToRemove }),
                    );
                }
            }

            onProgress({ checkpoint, transactions: pending });

            // get fresh state
            const transactions = getState().wallet.transactions.transactions[account.key];
            const hasAnonymityError = selectHasAnonymitySetError(getState());

            if (transactions !== prevTransactions || isInitialUpdate || hasAnonymityError) {
                const accountInfo = await backend.getAccountInfo(
                    account.descriptor,
                    transactions ?? [],
                    checkpoint,
                    cache,
                );

                // TODO accountInfo.utxo don't have proper utxo.confirmations field, only 0/1

                if (isInitialUpdate) {
                    // On initial update, calculate account anonymity set AND liquidity clue in CoinjoinClient
                    // Further updates of liquidity clue are done after coinjoin tx signing process
                    const { anonymityScores, rawLiquidityClue } = await client.analyzeTransactions(
                        accountInfo.history.transactions,
                    );
                    accountInfo.addresses.anonymitySet = anonymityScores;
                    dispatch(coinjoinAccountSetLiquidityClue(account.key, rawLiquidityClue));
                } else {
                    // Else calculate only account anonymity set in CoinjoinClient
                    const { anonymityScores } = await client.analyzeTransactions(
                        accountInfo.history.transactions,
                        ['anonymityScores'],
                    );
                    accountInfo.addresses.anonymitySet = anonymityScores;
                }

                // TODO when transaction analysis fails, still allow to use account in some restricted mode?

                // status must be set here already (instead of wait for endCoinjoinAccountSync)
                // so it's potentially stored into db
                dispatch(
                    accountsActions.updateAccount({ ...account, status: 'ready' }, accountInfo),
                );

                // update account in CoinjoinClient
                dispatch(updateClientAccount(account));
            }

            dispatch(accountsActions.endCoinjoinAccountSync(account, 'ready'));
        } catch (error) {
            // 'error' when no previous discovery was successful, 'out-of-sync' otherwise
            const status = isInitialUpdate ? 'error' : 'out-of-sync';
            dispatch(accountsActions.endCoinjoinAccountSync(account, status));
        } finally {
            backend.off(`progress/${progressHandle}`, onProgress);
        }
    };

const clearCoinjoinInstances = ({
    networkSymbol,
    coinjoinAccounts,
    dispatch,
}: {
    networkSymbol: NetworkSymbol;
    coinjoinAccounts: CoinjoinAccount[];
    dispatch: Dispatch;
}) => {
    dispatch(coinjoinAccountPreloading(false));
    const other = coinjoinAccounts.find(a => a.symbol === networkSymbol);
    // clear CoinjoinClientInstance if there are no related accounts left
    if (!other) {
        dispatch(coinjoinClientActions.clientDisable(networkSymbol));
        CoinjoinService.removeInstance(networkSymbol);
    }
};

const handleError = ({
    error,
    networkSymbol,
    dispatch,
    getState,
}: {
    error: string;
    networkSymbol: NetworkSymbol;
    dispatch: Dispatch;
    getState: GetState;
}) => {
    dispatch(
        notificationsActions.addToast({
            type: 'error',
            error,
        }),
    );
    const coinjoinAccounts = getState().wallet.coinjoin.accounts;
    clearCoinjoinInstances({ networkSymbol, coinjoinAccounts, dispatch });
};

export const createCoinjoinAccount =
    (network: Network, targetAnonymity: number) =>
    async (dispatch: Dispatch, getState: GetState) => {
        if (network.accountType !== 'coinjoin') {
            throw new Error('createCoinjoinAccount: invalid account type');
        }

        // initialize @trezor/coinjoin client
        const api = await dispatch(coinjoinClientActions.initCoinjoinService(network.symbol));
        if (!api) {
            return;
        }

        dispatch(coinjoinAccountPreloading(true));

        const { device } = getState().suite;
        const unlockPath = await TrezorConnect.unlockPath({
            path: "m/10025'",
            device,
            useEmptyPassphrase: device?.useEmptyPassphrase,
        });
        if (!unlockPath.success) {
            handleError({
                error: unlockPath.payload.error,
                networkSymbol: network.symbol,
                dispatch,
                getState,
            });
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
            handleError({
                error: publicKey.payload.error,
                networkSymbol: network.symbol,
                dispatch,
                getState,
            });
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

        dispatch(coinjoinAccountPreloading(false));

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
    (account: Account, coordinator: string, params: CoinjoinSessionParameters) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const { device } = getState().suite;

        // authorize coinjoin session on Trezor
        dispatch(coinjoinAccountAuthorize(account.key));

        const auth = await TrezorConnect.authorizeCoinjoin({
            device,
            useEmptyPassphrase: device?.useEmptyPassphrase,
            path: account.path,
            coin: account.symbol,
            coordinator,
            maxCoordinatorFeeRate: params.maxCoordinatorFeeRate * COORDINATOR_FEE_RATE_MULTIPLIER,
            maxFeePerKvbyte: params.maxFeePerKvbyte,
            maxRounds: params.maxRounds,
        });

        if (auth.success) {
            dispatch(coinjoinAccountAuthorizeSuccess(account.key, params));
            return true;
        }

        dispatch(coinjoinAccountAuthorizeFailed(account.key, auth.payload.error));

        dispatch(
            notificationsActions.addToast({
                type: 'error',
                error: `Coinjoin not authorized: ${auth.payload.error}`,
            }),
        );
    };

// called from coinjoin account UI
export const startCoinjoinSession =
    (account: Account, params: CoinjoinSessionParameters) =>
    async (dispatch: Dispatch, getState: GetState) => {
        if (account.accountType !== 'coinjoin') {
            throw new Error('startCoinjoinSession: invalid account type');
        }

        // initialize @trezor/coinjoin client
        const api = await dispatch(coinjoinClientActions.initCoinjoinService(account.symbol));
        const coinjoinAccount = selectCoinjoinAccountByKey(getState(), account.key);

        if (!api || !coinjoinAccount) {
            return;
        }

        dispatch(coinjoinSessionStarting(account.key, true));

        // authorize CoinjoinSession on Trezor
        const authResult = await dispatch(
            authorizeCoinjoin(account, api.client.settings.coordinatorName, params),
        );

        if (authResult) {
            // register authorized account
            api.client.registerAccount(
                getRegisterAccountParams(account, params, coinjoinAccount.rawLiquidityClue),
            );
            // switch to account
            dispatch(goto('wallet-index', { preserveParams: true }));
        }

        dispatch(coinjoinSessionStarting(account.key, false));
    };

// called from coinjoin account UI or exceptions like device disconnection, forget wallet/account etc.
export const pauseCoinjoinSession =
    (accountKey: string, interrupted = false) =>
    (dispatch: Dispatch, getState: GetState) => {
        const account = selectAccountByKey(getState(), accountKey);

        if (!account) {
            return;
        }
        // get @trezor/coinjoin client if available
        const client = coinjoinClientActions.getCoinjoinClient(account.symbol);

        // unregister account in @trezor/coinjoin
        client?.unregisterAccount(accountKey);

        // dispatch data to reducer
        dispatch(coinjoinSessionPause(accountKey, interrupted));
    };

export const pauseCoinjoinSessionByDeviceId =
    (deviceID: string) => (dispatch: Dispatch, getState: GetState) => {
        const state = getState();

        const disconnectedDevices = state.devices.filter(d => d.id === deviceID && d.remember);
        const affectedAccounts = disconnectedDevices.flatMap(d =>
            state.wallet.accounts.filter(
                a => a.accountType === 'coinjoin' && a.deviceState === d.state,
            ),
        );

        affectedAccounts.forEach(account => {
            const isAccountWithSession = selectIsAccountWithSessionByAccountKey(state, account.key);
            if (isAccountWithSession) {
                // log exception in critical phase
                if (selectIsAccountWithSessionInCriticalPhaseByAccountKey(state, account.key)) {
                    dispatch(
                        coinjoinClientActions.clientEmitException(
                            `Device disconnected in critical phase`,
                            {
                                symbol: account.symbol,
                            },
                        ),
                    );
                }
                const hasRunningSession = selectIsAccountWithSessionByAccountKey(
                    state,
                    account.key,
                );
                if (hasRunningSession) {
                    // get @trezor/coinjoin client if available
                    const client = coinjoinClientActions.getCoinjoinClient(account.symbol);

                    // unregister account in @trezor/coinjoin
                    client?.unregisterAccount(account.key);

                    // dispatch data to reducer
                    dispatch(coinjoinSessionPause(account.key, false));
                }
            }
        });
    };

// called from coinjoin account UI
// try to restore current paused CoinjoinSession
// use same parameters as in startCoinjoinSession but recalculate maxRounds value
// if Trezor is already preauthorized it will not ask for confirmation
export const restoreCoinjoinSession =
    (accountKey: string) => async (dispatch: Dispatch, getState: GetState) => {
        // TODO: check if device is connected, passphrase is authorized...
        const state = getState();
        const { device, locks } = state.suite;
        const account = selectAccountByKey(state, accountKey);

        if (!account) {
            return;
        }

        const errorToast = (error: string) => {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error,
                }),
            );
        };

        if (!device?.connected) {
            return errorToast('Device disconnected');
        }

        if (locks.includes(SUITE.LOCK_TYPE.DEVICE)) {
            return errorToast('Device locked');
        }

        // get @trezor/coinjoin client if available
        const client = coinjoinClientActions.getCoinjoinClient(account.symbol);
        if (!client) {
            return errorToast('CoinjoinClient is not enabled');
        }
        // get fresh data from reducer
        const coinjoinAccount = selectCoinjoinAccountByKey(state, account.key);
        if (!coinjoinAccount || !coinjoinAccount.session) {
            return errorToast('Coinjoin account session is missing');
        }

        const { session, rawLiquidityClue } = coinjoinAccount;

        dispatch(coinjoinSessionStarting(accountKey, true));

        const auth = await TrezorConnect.authorizeCoinjoin({
            device,
            useEmptyPassphrase: device?.useEmptyPassphrase,
            path: account.path,
            coin: account.symbol,
            preauthorized: true, // this parameter will check if device is already authorized
            // reuse session params
            coordinator: client.settings.coordinatorName,
            maxCoordinatorFeeRate: session.maxCoordinatorFeeRate * COORDINATOR_FEE_RATE_MULTIPLIER,
            maxFeePerKvbyte: session.maxFeePerKvbyte,
            maxRounds: session.maxRounds - session.signedRounds.length,
        });

        if (auth.success) {
            // dispatch data to reducer
            dispatch(coinjoinSessionRestore(account.key));
            // register authorized account
            client.registerAccount(getRegisterAccountParams(account, session, rawLiquidityClue));
        } else {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: `Coinjoin not authorized: ${auth.payload.error}`,
                }),
            );
        }

        dispatch(coinjoinSessionStarting(accountKey, false));
    };

export const interruptAllCoinjoinSessions = () => (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const coinjoinAccounts = selectCoinjoinAccounts(state);

    coinjoinAccounts.forEach(account => {
        const hasRunningSession = selectIsAccountWithSessionByAccountKey(state, account.key);
        if (hasRunningSession) {
            dispatch(pauseCoinjoinSession(account.key, true));
        }
    });
};

// check for blocking conditions of interrupted sessions and restore those eligible
export const restoreInterruptedCoinjoinSessions =
    () => (dispatch: Dispatch, getState: GetState) => {
        const state = getState();
        const coinjoinAccounts = selectCoinjoinAccounts(state);
        const eligibleAccounts = coinjoinAccounts.filter(({ key, session }) => {
            const hasSendFormOpen =
                state.router.route?.name === 'wallet-send' &&
                key === state.wallet.selectedAccount.account?.key;
            const blocker = selectCoinjoinSessionBlockerByAccountKey(state, key);
            return session?.interrupted && !hasSendFormOpen && !blocker;
        });

        eligibleAccounts.forEach(account => dispatch(restoreCoinjoinSession(account.key)));
    };

// called from coinjoin account UI or exceptions like device disconnection, forget wallet/account etc.
export const stopCoinjoinSession =
    (accountKey: string) => (dispatch: Dispatch, getState: GetState) => {
        const account = selectAccountByKey(getState(), accountKey);

        if (!account) {
            return;
        }

        // get @trezor/coinjoin client if available
        const client = coinjoinClientActions.getCoinjoinClient(account.symbol);
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
        const state = getState();
        const { coinjoin } = state.wallet;

        // find all accounts to unregister
        const coinjoinNetworks = coinjoin.accounts.reduce<NetworkSymbol[]>((res, cjAccount) => {
            const account = accounts.find(a => a.key === cjAccount.key);

            if (account) {
                // log exception in critical phase
                if (selectIsAccountWithSessionInCriticalPhaseByAccountKey(state, cjAccount.key)) {
                    dispatch(
                        coinjoinClientActions.clientEmitException(
                            `Forget account in critical phase`,
                            {
                                symbol: account.symbol,
                            },
                        ),
                    );
                }

                if (cjAccount.session) {
                    dispatch(stopCoinjoinSession(cjAccount.key));
                }

                dispatch(coinjoinAccountRemove(cjAccount.key));

                if (!res.includes(cjAccount.symbol)) {
                    return res.concat(cjAccount.symbol);
                }
            }

            return res;
        }, []);

        // get new state
        const coinjoinAccounts = selectCoinjoinAccounts(getState());

        coinjoinNetworks.forEach(networkSymbol => {
            clearCoinjoinInstances({ networkSymbol, coinjoinAccounts, dispatch });
        });
    };

export const restoreCoinjoinAccounts = () => (dispatch: Dispatch, getState: GetState) => {
    const { coinjoin } = getState().wallet;

    // find all networks to restore
    const coinjoinNetworks = coinjoin.accounts.reduce<NetworkSymbol[]>((res, account) => {
        // currently it is not possible to full restore session while using passphrase.
        // related to @trezor/connect and inner-outer state
        if (account.session && !account.session.paused) {
            dispatch(pauseCoinjoinSession(account.key));
        }

        if (!res.includes(account.symbol)) {
            return res.concat(account.symbol);
        }

        return res;
    }, []);

    // async actions in sequence, initialize CoinjoinCService for each network
    return promiseAllSequence(
        coinjoinNetworks.map(
            symbol => () => dispatch(coinjoinClientActions.initCoinjoinService(symbol)),
        ),
    );
};
