import { ScanAccountProgress, BroadcastedTransactionDetails } from '@trezor/coinjoin';
import TrezorConnect from '@trezor/connect';
import { promiseAllSequence } from '@trezor/utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { isDevEnv } from '@suite-common/suite-utils';
import { Network, NetworkSymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import {
    accountsActions,
    selectAccountByKey,
    transactionsActions,
    selectDevice,
    selectDevices,
} from '@suite-common/wallet-core';
import { getAccountTransactions, sortByBIP44AddressIndex } from '@suite-common/wallet-utils';

import { CoinjoinService, COORDINATOR_FEE_RATE_MULTIPLIER } from 'src/services/coinjoin';
import { getAccountProgressHandle, getRegisterAccountParams } from 'src/utils/wallet/coinjoinUtils';
import { Dispatch, GetState } from 'src/types/suite';
import {
    CoinjoinAccount,
    CoinjoinConfig,
    CoinjoinDiscoveryCheckpoint,
    CoinjoinSessionParameters,
} from 'src/types/wallet/coinjoin';
import {
    selectCoinjoinAccounts,
    selectCoinjoinAccountByKey,
    selectCoinjoinSessionBlockerByAccountKey,
    selectIsAccountWithSessionByAccountKey,
    selectIsAccountWithSessionInCriticalPhaseByAccountKey,
    selectIsAnySessionInCriticalPhase,
    selectHasAnonymitySetError,
    selectIsNothingToAnonymizeByAccountKey,
    selectSessionByAccountKey,
    selectWeightedAnonymityByAccountKey,
} from 'src/reducers/wallet/coinjoinReducer';
import { SUITE } from 'src/actions/suite/constants';
import { openModal } from 'src/actions/suite/modalActions';

import * as coinjoinClientActions from './coinjoinClientActions';
import { goto } from '../suite/routerActions';
import * as COINJOIN from './constants/coinjoinConstants';
import { selectLocks } from '../../reducers/suite/suiteReducer';

export const coinjoinAccountUpdateAnonymity = (accountKey: string, targetAnonymity: number) =>
    ({
        type: COINJOIN.ACCOUNT_UPDATE_TARGET_ANONYMITY,
        payload: {
            accountKey,
            targetAnonymity,
        },
    } as const);

export const coinjoinAccountUpdateMaxMiningFee = (accountKey: string, maxFeePerVbyte: number) =>
    ({
        type: COINJOIN.ACCOUNT_UPDATE_MAX_MING_FEE,
        payload: {
            accountKey,
            maxFeePerVbyte,
        },
    } as const);

export const coinjoinAccountToggleSkipRounds = (accountKey: string) =>
    ({
        type: COINJOIN.ACCOUNT_TOGGLE_SKIP_ROUNDS,
        payload: {
            accountKey,
        },
    } as const);

export const coinjoinAccountUpdateSetupOption = (accountKey: string, isRecommended: boolean) =>
    ({
        type: COINJOIN.ACCOUNT_UPDATE_SETUP_OPTION,
        payload: {
            accountKey,
            isRecommended,
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

const coinjoinSessionRestore = (accountKey: string) =>
    ({
        type: COINJOIN.SESSION_RESTORE,
        payload: {
            accountKey,
        },
    } as const);

const coinjoinAccountDiscoveryReset = (
    accountKey: string,
    checkpoint?: CoinjoinDiscoveryCheckpoint,
) =>
    ({
        type: COINJOIN.ACCOUNT_DISCOVERY_RESET,
        payload: {
            accountKey,
            checkpoint,
        },
    } as const);

const coinjoinAccountDiscoveryProgress = (accountKey: string, progress: ScanAccountProgress) =>
    ({
        type: COINJOIN.ACCOUNT_DISCOVERY_PROGRESS,
        payload: {
            accountKey,
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

export const coinjoinSessionAutostop = (accountKey: string, isAutostopped: boolean) =>
    ({
        type: COINJOIN.SESSION_AUTOSTOP,
        payload: {
            accountKey,
            isAutostopped,
        },
    } as const);

const coinjoinAccountUpdateAnonymityLevels = (accountKey: string, level: number) =>
    ({
        type: COINJOIN.ACCOUNT_ADD_ANONYMITY_LEVEL,
        payload: {
            accountKey,
            level,
        },
    } as const);

export const updateLastAnonymityReportTimestamp = (accountKey: string) =>
    ({
        type: COINJOIN.ACCOUNT_UPDATE_LAST_REPORT_TIMESTAMP,
        payload: { accountKey },
    } as const);

export const updateCoinjoinConfig = (payload: Partial<CoinjoinConfig>) =>
    ({
        type: COINJOIN.UPDATE_CONFIG,
        payload,
    } as const);

export type CoinjoinAccountAction =
    | ReturnType<typeof coinjoinAccountUpdateAnonymity>
    | ReturnType<typeof coinjoinAccountUpdateMaxMiningFee>
    | ReturnType<typeof coinjoinAccountToggleSkipRounds>
    | ReturnType<typeof coinjoinAccountUpdateSetupOption>
    | ReturnType<typeof coinjoinAccountSetLiquidityClue>
    | ReturnType<typeof coinjoinAccountAuthorize>
    | ReturnType<typeof coinjoinAccountAuthorizeSuccess>
    | ReturnType<typeof coinjoinAccountAuthorizeFailed>
    | ReturnType<typeof coinjoinAccountUnregister>
    | ReturnType<typeof coinjoinAccountDiscoveryReset>
    | ReturnType<typeof coinjoinAccountDiscoveryProgress>
    | ReturnType<typeof updateCoinjoinConfig>
    | ReturnType<typeof coinjoinAccountPreloading>
    | ReturnType<typeof coinjoinSessionRestore>
    | ReturnType<typeof coinjoinSessionStarting>
    | ReturnType<typeof coinjoinSessionAutostop>
    | ReturnType<typeof updateLastAnonymityReportTimestamp>
    | ReturnType<typeof coinjoinAccountUpdateAnonymityLevels>;

const EMPTY_ACCOUNT_INFO = {
    addresses: { change: [], used: [], unused: [] },
    availableBalance: '0',
    balance: '0',
    empty: true,
    history: { total: 0, unconfirmed: 0 },
    page: { index: 1, size: 25, total: 1 },
    utxo: [],
};

const log = (...params: any[]) => isDevEnv && console.log(...params);
const warn = (...params: any[]) => isDevEnv && console.warn(...params);

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

        const { rawLiquidityClue, session } = coinjoinAccount;

        client.updateAccount(
            getRegisterAccountParams(accountToUpdate, {
                rawLiquidityClue,
                session,
            }),
        );

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
        if (!previousCheckpoint) return;
        if (
            checkpoint.blockHeight < previousCheckpoint.blockHeight ||
            (checkpoint.blockHeight === previousCheckpoint.blockHeight &&
                checkpoint.blockHash !== previousCheckpoint.blockHash)
        ) {
            log(
                `CoinjoinAccount reorg: ${previousCheckpoint.blockHeight}:${previousCheckpoint.blockHash} -> ${checkpoint.blockHeight}:${checkpoint.blockHash}`,
            );
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
Prepending txs have deadline (blockHeight) when they should be removed from UI.
In case of adding a coinjoin transaction, log anonymity gain.
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

        // Log anonymity gain if the newly added transaction is a coinjoin transaction.
        if (accountInfo.history.transactions[0].type === 'joint') {
            const anonymityBeforeUpdate = selectWeightedAnonymityByAccountKey(state, account.key);
            const anonymityAfterUpdate = selectWeightedAnonymityByAccountKey(
                getState(),
                account.key,
            );

            dispatch(
                coinjoinAccountUpdateAnonymityLevels(
                    account.key,
                    parseFloat((anonymityAfterUpdate - anonymityBeforeUpdate).toFixed(3)),
                ),
            );
        }
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

/** Remove outdated pending transactions */
const cleanPendingTransactions =
    (account: Account, pending: { txid: string }[]) => (dispatch: Dispatch, getState: GetState) => {
        const {
            wallet: {
                transactions: { transactions },
                blockchain: {
                    [account.symbol]: { blockHeight },
                },
            },
        } = getState();
        const pendingTxids = pending.map(({ txid }) => txid);
        const txs = getAccountTransactions(account.key, transactions).filter(tx =>
            tx.deadline
                ? // remove prepending transactions with outdated deadline
                  tx.deadline < blockHeight
                : // remove pending transactions absent from the last batch
                  (tx.blockHeight ?? 0) <= 0 && !pendingTxids.includes(tx.txid),
        );
        if (txs.length) {
            dispatch(transactionsActions.removeTransaction({ account, txs }));
        }
    };

export const fetchAndUpdateAccount =
    ({ key: accountKey, symbol }: Account) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const state = getState();
        // do not sync if any account CoinjoinSession is in critical phase
        if (selectIsAnySessionInCriticalPhase(state)) return;

        const api = await dispatch(coinjoinClientActions.initCoinjoinService(symbol));
        if (!api) return;

        const { backend, client } = api;

        // get fresh account info, mainly so there's nothing between syncing check and startCoinjoinAccountSync
        const account = selectAccountByKey(getState(), accountKey);
        if (account?.backendType !== 'coinjoin' || account.syncing) return;

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
            dispatch(coinjoinAccountDiscoveryProgress(account.key, progress));
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

            onProgress({ checkpoint, transactions: pending });

            dispatch(cleanPendingTransactions(account, pending));

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
            backend.emit('log', { level: 'error', payload: error?.toString() });
            // 'error' when no previous discovery was successful, 'out-of-sync' otherwise
            const status = isInitialUpdate ? 'error' : 'out-of-sync';
            dispatch(accountsActions.endCoinjoinAccountSync(account, status));
        } finally {
            backend.off(`progress/${progressHandle}`, onProgress);
        }
    };

export const clearCoinjoinInstances =
    (networkSymbol: NetworkSymbol) => (dispatch: Dispatch, getState: GetState) => {
        const cjAccount = selectCoinjoinAccounts(getState()).find(a => a.symbol === networkSymbol);
        // clear CoinjoinClientInstance if there are no related accounts left
        if (!cjAccount) {
            dispatch(coinjoinClientActions.clientDisable(networkSymbol));
            CoinjoinService.removeInstance(networkSymbol);
        }
    };

const handleError = (error: string) => (dispatch: Dispatch) => {
    dispatch(notificationsActions.addToast({ type: 'error', error }));
};

export const createCoinjoinAccount =
    (network: Network) => async (dispatch: Dispatch, getState: GetState) => {
        if (network.accountType !== 'coinjoin') {
            throw new Error('createCoinjoinAccount: invalid account type');
        }

        // initialize @trezor/coinjoin client
        const api = await dispatch(coinjoinClientActions.initCoinjoinService(network.symbol));
        if (!api) {
            return;
        }

        dispatch(coinjoinAccountPreloading(true));

        const device = selectDevice(getState());
        const unlockPath = await TrezorConnect.unlockPath({
            path: "m/10025'",
            device,
            useEmptyPassphrase: device?.useEmptyPassphrase,
        });
        if (!unlockPath.success) {
            dispatch(handleError(unlockPath.payload.error));
            dispatch(clearCoinjoinInstances(network.symbol));
            dispatch(coinjoinAccountPreloading(false));
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
            suppressBackupWarning: true,
        });
        if (!publicKey.success) {
            dispatch(handleError(publicKey.payload.error));
            dispatch(clearCoinjoinInstances(network.symbol));
            dispatch(coinjoinAccountPreloading(false));
            return;
        }

        // create empty account
        const account = dispatch(
            accountsActions.createAccount({
                deviceState: device!.state!,
                discoveryItem: {
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
                accountInfo: {
                    ...EMPTY_ACCOUNT_INFO,
                    descriptor: publicKey.payload.xpubSegwit || publicKey.payload.xpub,
                    legacyXpub: publicKey.payload.xpub,
                },
            }),
        );

        log(`CoinjoinAccount created: ${getAccountProgressHandle(account.payload)}`);

        // birthdate optimization
        const checkpoint = await api.backend.getAccountCheckpoint(account.payload.descriptor);
        dispatch(coinjoinAccountDiscoveryReset(account.payload.key, checkpoint));

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
        return dispatch(fetchAndUpdateAccount(account.payload));
    };

export const rescanCoinjoinAccount =
    (accountKey: string, fullRescan = false) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const state = getState();
        const account = selectAccountByKey(state, accountKey);
        if (account?.backendType !== 'coinjoin' || account.syncing) return;
        if (selectIsAnySessionInCriticalPhase(state)) return;
        const api = await dispatch(coinjoinClientActions.initCoinjoinService(account.symbol));
        if (!api) return;

        // lock
        dispatch(accountsActions.startCoinjoinAccountSync(account));

        // clear txs
        dispatch(transactionsActions.resetTransaction({ account }));

        // reset cj account
        const checkpoint = fullRescan
            ? undefined
            : await api.backend.getAccountCheckpoint(account.descriptor);
        dispatch(coinjoinAccountDiscoveryReset(accountKey, checkpoint));

        // reset account + unlock
        const { payload } = dispatch(
            accountsActions.updateAccount(
                { ...account, status: 'initial' },
                { ...EMPTY_ACCOUNT_INFO, descriptor: account.descriptor },
            ),
        );

        // start discovery
        return dispatch(fetchAndUpdateAccount(payload));
    };

const authorizeCoinjoin =
    (account: Account, coordinator: string, params: CoinjoinSessionParameters) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const device = selectDevice(getState());

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
                getRegisterAccountParams(account, {
                    rawLiquidityClue: coinjoinAccount.rawLiquidityClue,
                    session: params,
                }),
            );
            // switch to account
            dispatch(goto('wallet-index', { preserveParams: true }));
        }

        dispatch(coinjoinSessionStarting(account.key, false));
    };

// called from coinjoin account UI
// try to restore current paused CoinjoinSession
// use same parameters as in startCoinjoinSession but recalculate maxRounds value
// if Trezor is already preauthorized it will not ask for confirmation
export const restoreCoinjoinSession =
    (accountKey: string) => async (dispatch: Dispatch, getState: GetState) => {
        // TODO: check if device is connected, passphrase is authorized...
        const locks = selectLocks(getState());
        const device = selectDevice(getState());
        const account = selectAccountByKey(getState(), accountKey);

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
        const coinjoinAccount = selectCoinjoinAccountByKey(getState(), account.key);
        if (!coinjoinAccount || !coinjoinAccount.session) {
            return errorToast('Coinjoin account session is missing');
        }

        const { rawLiquidityClue, session } = coinjoinAccount;

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
            client.registerAccount(
                getRegisterAccountParams(account, {
                    rawLiquidityClue,
                    session,
                }),
            );
        } else {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: `Coinjoin not authorized: `,
                }),
            );
        }

        dispatch(coinjoinSessionStarting(accountKey, false));
    };

export const pauseAllCoinjoinSessions = () => (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const coinjoinAccounts = selectCoinjoinAccounts(state);

    coinjoinAccounts.forEach(account => {
        const hasRunningSession = selectIsAccountWithSessionByAccountKey(state, account.key);
        if (hasRunningSession) {
            dispatch(coinjoinClientActions.pauseCoinjoinSession(account.key));
        }
    });
};

// check for blocking conditions of interrupted sessions and restore those eligible
export const restorePausedCoinjoinSessions = () => (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const coinjoinAccounts = selectCoinjoinAccounts(state);
    const eligibleAccounts = coinjoinAccounts.filter(({ key, session }) => {
        const hasSendFormOpen =
            state.router.route?.name === 'wallet-send' &&
            key === state.wallet.selectedAccount.account?.key;
        const blocker = selectCoinjoinSessionBlockerByAccountKey(state, key);
        return !hasSendFormOpen && !blocker && session?.paused;
    });

    eligibleAccounts.forEach(account => dispatch(restoreCoinjoinSession(account.key)));
};

export const stopCoinjoinAccount =
    (account: Account) => (dispatch: Dispatch, getState: GetState) => {
        const cjAccount = selectCoinjoinAccountByKey(getState(), account.key);

        if (cjAccount?.session) {
            if ((cjAccount.session.roundPhase ?? 0) > 0) {
                dispatch(
                    coinjoinClientActions.clientEmitException(`Forget account in critical phase`, {
                        symbol: account.symbol,
                    }),
                );
            }
            dispatch(coinjoinClientActions.stopCoinjoinSession(cjAccount.key));
        }
    };

export const stopCoinjoinSessionByDeviceId =
    (deviceID: string) => (dispatch: Dispatch, getState: GetState) => {
        const state = getState();

        const devices = selectDevices(state);
        const disconnectedDevices = devices.filter(d => d.id === deviceID && d.remember);
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

                dispatch(coinjoinClientActions.stopCoinjoinSession(account.key));
            }
        });
    };

export const restoreCoinjoinAccounts = () => (dispatch: Dispatch, getState: GetState) => {
    const { coinjoin } = getState().wallet;

    // find all networks to restore
    const coinjoinNetworks = coinjoin.accounts.reduce<NetworkSymbol[]>((res, account) => {
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

export const toggleAutostopCoinjoin =
    (accountKey: string) => (dispatch: Dispatch, getState: GetState) => {
        const currentAccountState = selectSessionByAccountKey(getState(), accountKey);

        if (!currentAccountState) {
            return;
        }

        const newState = !currentAccountState.isAutoStopEnabled;

        dispatch(coinjoinSessionAutostop(accountKey, newState));
    };

export const logCoinjoinAccounts = () => (_: Dispatch, getState: GetState) => {
    const {
        accounts,
        coinjoin: { accounts: cjAccounts },
        transactions: { transactions },
    } = getState().wallet;
    accounts
        .filter(({ accountType }) => accountType === 'coinjoin')
        .forEach(account => {
            const handle = getAccountProgressHandle(account);
            const cjAccount = cjAccounts.find(({ key }) => key === account.key);
            const checkpoints = cjAccount?.checkpoints?.map(cp => cp.blockHeight);
            const txs = transactions[account.key];
            log(
                `CoinjoinAccount remembered: ${handle}, checkpoints: ${checkpoints}, transactions: ${txs?.length}`,
            );
        });
    cjAccounts
        .filter(({ key }) => !accounts.some(acc => acc.key === key))
        .forEach(cjAccount => {
            const handle = getAccountProgressHandle(cjAccount);
            const checkpoints = cjAccount.checkpoints?.map(cp => cp.blockHeight);
            warn(`CoinjoinAccount residue: ${handle}, checkpoints: ${checkpoints}`);
        });
};
