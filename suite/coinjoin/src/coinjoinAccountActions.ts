import { createAction, isAnyOf } from '@reduxjs/toolkit';

import { type SelectedAccountRootState } from '@suite/account';
import { type LocksRootState, selectIsDeviceLocked } from '@suite/locks';
import { type ModalRootState, openModal } from '@suite/modal';
import { type RouterRootState, gotoThunk, selectRouteName } from '@suite/router';
import { type TorRootState } from '@suite/tor';
import { type DeviceRootState, selectDevices, selectSelectedDevice } from '@suite-common/device';
import { type MessageSystemRootState } from '@suite-common/message-system';
import { type Dispatch } from '@suite-common/redux-utils';
import { isDevEnv } from '@suite-common/suite-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import type { Network, NetworkAccount, NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type BlockchainRootState,
    type TransactionsRootState,
    accountsActions,
    selectAccountByKey,
    transactionsActions,
} from '@suite-common/wallet-core';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import {
    getAccountTransactions,
    sortByBIP44AddressIndex,
    substituteBip43Path,
} from '@suite-common/wallet-utils';
import { type BroadcastedTransactionDetails, type ScanAccountProgress } from '@trezor/coinjoin';
import TrezorConnect from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';
import { promiseAllSequence } from '@trezor/utils';

import * as coinjoinClientActions from './coinjoinClientActions';
import * as COINJOIN from './coinjoinConstants';
import {
    type CoinjoinRootState,
    type SuiteOnlineRootState,
    selectCoinjoinAccountByKey,
    selectCoinjoinAccounts,
    selectCoinjoinSessionBlockerByAccountKey,
    selectHasAnonymitySetError,
    selectIsAccountWithSessionByAccountKey,
    selectIsAccountWithSessionInCriticalPhaseByAccountKey,
    selectIsAnySessionInCriticalPhase,
    selectIsNothingToAnonymizeByAccountKey,
    selectSessionByAccountKey,
    selectWeightedAnonymityByAccountKey,
} from './coinjoinSelectors';
import { CoinjoinService } from './coinjoinService';
import {
    type CoinjoinAccount,
    type CoinjoinConfig,
    type CoinjoinDiscoveryCheckpoint,
    type CoinjoinSessionParameters,
} from './coinjoinTypes';
import {
    getAccountProgressHandle,
    getRegisterAccountParams,
    isCoinjoinSupportedSymbol,
} from './coinjoinUtils';
import { COORDINATOR_FEE_RATE_MULTIPLIER, type CoinjoinSymbol } from './config';

export const coinjoinAccountUpdateAnonymity = createAction(
    COINJOIN.ACCOUNT_UPDATE_TARGET_ANONYMITY,
    (accountKey: string, targetAnonymity: number) => ({
        payload: { accountKey, targetAnonymity },
    }),
);

export const coinjoinAccountUpdateMaxMiningFee = createAction(
    COINJOIN.ACCOUNT_UPDATE_MAX_MING_FEE,
    (accountKey: string, maxFeePerVbyte: number) => ({
        payload: { accountKey, maxFeePerVbyte },
    }),
);

export const coinjoinAccountToggleSkipRounds = createAction(
    COINJOIN.ACCOUNT_TOGGLE_SKIP_ROUNDS,
    (accountKey: string) => ({ payload: { accountKey } }),
);

export const coinjoinAccountUpdateSetupOption = createAction(
    COINJOIN.ACCOUNT_UPDATE_SETUP_OPTION,
    (accountKey: string, isRecommended: boolean) => ({
        payload: { accountKey, isRecommended },
    }),
);

export const coinjoinAccountSetLiquidityClue = createAction(
    COINJOIN.ACCOUNT_SET_LIQUIDITY_CLUE,
    (accountKey: string, rawLiquidityClue: CoinjoinAccount['rawLiquidityClue']) => ({
        payload: { accountKey, rawLiquidityClue },
    }),
);

const coinjoinAccountAuthorize = createAction(COINJOIN.ACCOUNT_AUTHORIZE, (accountKey: string) => ({
    payload: { accountKey },
}));

const coinjoinAccountAuthorizeSuccess = createAction(
    COINJOIN.ACCOUNT_AUTHORIZE_SUCCESS,
    (accountKey: string, params: CoinjoinSessionParameters) => ({
        payload: { accountKey, params },
    }),
);

const coinjoinAccountAuthorizeFailed = createAction(
    COINJOIN.ACCOUNT_AUTHORIZE_FAILED,
    (accountKey: string, error: string) => ({ payload: { accountKey, error } }),
);

const coinjoinAccountPreloading = createAction(
    COINJOIN.ACCOUNT_PRELOADING,
    (isPreloading: boolean) => ({ payload: { isPreloading } }),
);

const coinjoinSessionRestore = createAction(COINJOIN.SESSION_RESTORE, (accountKey: string) => ({
    payload: { accountKey },
}));

const coinjoinAccountDiscoveryReset = createAction(
    COINJOIN.ACCOUNT_DISCOVERY_RESET,
    (accountKey: string, checkpoint?: CoinjoinDiscoveryCheckpoint) => ({
        payload: { accountKey, checkpoint },
    }),
);

const coinjoinAccountDiscoveryProgress = createAction(
    COINJOIN.ACCOUNT_DISCOVERY_PROGRESS,
    (accountKey: string, progress: ScanAccountProgress) => ({
        payload: { accountKey, progress },
    }),
);

const coinjoinSessionStarting = createAction(
    COINJOIN.SESSION_STARTING,
    (accountKey: string, isStarting: boolean) => ({ payload: { accountKey, isStarting } }),
);

export const coinjoinSessionAutostop = createAction(
    COINJOIN.SESSION_AUTOSTOP,
    (accountKey: string, isAutostopped: boolean) => ({
        payload: { accountKey, isAutostopped },
    }),
);

const coinjoinAccountUpdateAnonymityLevels = createAction(
    COINJOIN.ACCOUNT_ADD_ANONYMITY_LEVEL,
    (accountKey: string, level: number) => ({ payload: { accountKey, level } }),
);

export const updateLastAnonymityReportTimestamp = createAction(
    COINJOIN.ACCOUNT_UPDATE_LAST_REPORT_TIMESTAMP,
    (accountKey: string) => ({ payload: { accountKey } }),
);

export const updateCoinjoinConfig = createAction(
    COINJOIN.UPDATE_CONFIG,
    (payload: Partial<CoinjoinConfig>) => ({ payload }),
);

export const isCoinjoinAccountPersistenceAction = isAnyOf(
    coinjoinAccountDiscoveryReset,
    coinjoinAccountDiscoveryProgress,
    coinjoinAccountAuthorizeSuccess,
    coinjoinClientActions.coinjoinAccountUnregister,
    coinjoinAccountUpdateSetupOption,
    coinjoinAccountUpdateAnonymity,
    coinjoinAccountUpdateMaxMiningFee,
    coinjoinAccountToggleSkipRounds,
);

export type CoinjoinAccountAction = ReturnType<
    | typeof coinjoinAccountUpdateAnonymity
    | typeof coinjoinAccountUpdateMaxMiningFee
    | typeof coinjoinAccountToggleSkipRounds
    | typeof coinjoinAccountUpdateSetupOption
    | typeof coinjoinAccountSetLiquidityClue
    | typeof coinjoinAccountAuthorize
    | typeof coinjoinAccountAuthorizeSuccess
    | typeof coinjoinAccountAuthorizeFailed
    | typeof coinjoinAccountDiscoveryReset
    | typeof coinjoinAccountDiscoveryProgress
    | typeof updateCoinjoinConfig
    | typeof coinjoinAccountPreloading
    | typeof coinjoinSessionRestore
    | typeof coinjoinSessionStarting
    | typeof coinjoinSessionAutostop
    | typeof updateLastAnonymityReportTimestamp
    | typeof coinjoinAccountUpdateAnonymityLevels
>;

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
    getState: () => CoinjoinRootState,
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

type UpdateClientAccountThunkState = AccountsRootState & CoinjoinRootState & ModalRootState;

export const updateClientAccountThunk =
    (account: Account) => (dispatch: Dispatch, getState: () => UpdateClientAccountThunkState) => {
        if (!isCoinjoinSupportedSymbol(account.symbol)) return;
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

type CoinjoinAccountCheckReorgThunkState = CoinjoinRootState & TransactionsRootState;

const coinjoinAccountCheckReorgThunk =
    (account: Account, checkpoint: ScanAccountProgress['checkpoint']) =>
    (dispatch: Dispatch, getState: () => CoinjoinAccountCheckReorgThunkState) => {
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

type UpdatePendingAccountInfoThunkState = CoinjoinRootState & TransactionsRootState;

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
export const updatePendingAccountInfoThunk =
    (accountKey: AccountKey) =>
    async (dispatch: Dispatch, getState: () => UpdatePendingAccountInfoThunkState) => {
        const state = getState();
        const account = selectAccountByKey(state, accountKey);
        const coinjoinAccount = selectCoinjoinAccountByKey(state, accountKey);
        if (account?.backendType !== 'coinjoin' || !coinjoinAccount?.checkpoints) return;

        const api = await dispatch(coinjoinClientActions.initCoinjoinServiceThunk(account.symbol));
        if (!api) return;

        const { backend, client } = api;
        const transactions = state.wallet.transactions.transactions[account.key] ?? [];
        const checkpoint = coinjoinAccount.checkpoints[0];
        if (!checkpoint) return;

        const accountInfo = await backend.getAccountInfo(
            account.descriptor,
            transactions,
            checkpoint,
            getAccountCache(account),
        );

        const { anonymityScores } = await client.analyzeTransactions(
            accountInfo.history.transactions,
            ['anonymityScores'],
        );
        accountInfo.addresses.anonymitySet = anonymityScores;

        dispatch(accountsActions.updateAccount(account, accountInfo));

        // Log anonymity gain if the newly added transaction is a coinjoin transaction.
        if (accountInfo.history.transactions[0]?.type === 'joint') {
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

type CreatePendingTransactionThunkState = AccountsRootState &
    BlockchainRootState &
    CoinjoinRootState;

export const createPendingTransactionThunk =
    (accountKey: AccountKey, payload: BroadcastedTransactionDetails) =>
    async (dispatch: Dispatch, getState: () => CreatePendingTransactionThunkState) => {
        const state = getState();
        const account = selectAccountByKey(state, accountKey);
        const coinjoinAccount = selectCoinjoinAccountByKey(state, accountKey);
        if (account?.backendType !== 'coinjoin' || !coinjoinAccount?.checkpoints) return;

        const api = await dispatch(coinjoinClientActions.initCoinjoinServiceThunk(account.symbol));
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

type CleanPendingTransactionsThunkState = BlockchainRootState & TransactionsRootState;

/** Remove outdated pending transactions */
const cleanPendingTransactionsThunk =
    (account: Account, pending: { txid: string }[]) =>
    (dispatch: Dispatch, getState: () => CleanPendingTransactionsThunkState) => {
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

type FetchAndUpdateAccountThunkState = CoinjoinRootState &
    SelectedAccountRootState &
    TransactionsRootState;

export const fetchAndUpdateAccountThunk =
    ({ key: accountKey, symbol }: Account) =>
    async (dispatch: Dispatch, getState: () => FetchAndUpdateAccountThunkState) => {
        const state = getState();
        // do not sync if any account CoinjoinSession is in critical phase
        if (selectIsAnySessionInCriticalPhase(state)) return;

        const api = await dispatch(coinjoinClientActions.initCoinjoinServiceThunk(symbol));
        if (!api) return;

        const { backend, client } = api;

        // get fresh account info, mainly so there's nothing between syncing check and startCoinjoinAccountSync
        const account = selectAccountByKey(getState(), accountKey);
        if (account?.backendType !== 'coinjoin' || account.syncing) return;

        const isInitialUpdate = account.status === 'initial' || account.status === 'error';
        dispatch(accountsActions.startCoinjoinAccountSync(account));

        const onProgress = (progress: ScanAccountProgress) => {
            // removes transactions if current checkpoint precedes latest stored checkpoint
            dispatch(coinjoinAccountCheckReorgThunk(account, progress.checkpoint));
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

            dispatch(cleanPendingTransactionsThunk(account, pending));

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
                    accountsActions.updateAccount(
                        { ...account, status: 'ready' as const },
                        accountInfo,
                    ),
                );

                // update account in CoinjoinClient
                dispatch(updateClientAccountThunk(account));
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

type ClearCoinjoinInstancesThunkState = CoinjoinRootState;

export const clearCoinjoinInstancesThunk =
    (symbol: CoinjoinSymbol) =>
    (dispatch: Dispatch, getState: () => ClearCoinjoinInstancesThunkState) => {
        const cjAccount = selectCoinjoinAccounts(getState()).find(a => a.symbol === symbol);
        // clear CoinjoinClientInstance if there are no related accounts left
        if (!cjAccount) {
            dispatch(coinjoinClientActions.clientDisable(symbol));
            CoinjoinService.removeInstance(symbol);
        }
    };

const handleError = (error: string) => (dispatch: Dispatch) => {
    dispatch(notificationsActions.addToast({ type: 'error', error }));
};

type CreateCoinjoinAccountThunkState = DeviceRootState;

export const createCoinjoinAccountThunk =
    (network: Network, account: NetworkAccount) =>
    async (dispatch: Dispatch, getState: () => CreateCoinjoinAccountThunkState) => {
        if (account.accountType !== 'coinjoin') {
            throw new Error('createCoinjoinAccount: invalid account type');
        }

        if (!isCoinjoinSupportedSymbol(network.symbol)) {
            return;
        }

        // initialize @trezor/coinjoin client
        const api = await dispatch(coinjoinClientActions.initCoinjoinServiceThunk(network.symbol));
        if (!api) {
            return;
        }

        dispatch(coinjoinAccountPreloading(true));

        const device = selectSelectedDevice(getState());
        const unlockPath = await TrezorConnect.unlockPath({ path: "m/10025'", device });
        if (!unlockPath.success) {
            dispatch(handleError(unlockPath.error.message));
            dispatch(clearCoinjoinInstancesThunk(network.symbol));
            dispatch(coinjoinAccountPreloading(false));

            return;
        }

        const path = substituteBip43Path(account.bip43Path);

        // get coinjoin account xpub
        const publicKey = await TrezorConnect.getPublicKey({
            path,
            unlockPath: unlockPath.payload,
            device,
            coin: asCoinSymbol(network.symbol),
            suppressBackupWarning: true,
        });
        if (!publicKey.success) {
            dispatch(handleError(publicKey.error.message));
            dispatch(clearCoinjoinInstancesThunk(network.symbol));
            dispatch(coinjoinAccountPreloading(false));

            return;
        }

        // create empty account
        const coinjoinAccount = dispatch(
            accountsActions.createAccount({
                deviceState: device!.state!.staticSessionId!,
                index: 0,
                path,
                unlockPath: unlockPath.payload,
                accountType: account.accountType,
                backendType: 'coinjoin',
                status: 'initial',
                symbol: network.symbol,
                accountInfo: {
                    ...EMPTY_ACCOUNT_INFO,
                    descriptor: publicKey.payload.xpubSegwit || publicKey.payload.xpub,
                    legacyXpub: publicKey.payload.xpub,
                },
                visible: true,
            }),
        );

        log(`CoinjoinAccount created: ${getAccountProgressHandle(coinjoinAccount.payload)}`);

        // birthdate optimization
        const checkpoint = await api.backend.getAccountCheckpoint(
            coinjoinAccount.payload.descriptor,
        );
        dispatch(coinjoinAccountDiscoveryReset(coinjoinAccount.payload.key, checkpoint));

        dispatch(coinjoinAccountPreloading(false));

        // switch to account
        dispatch(
            gotoThunk({
                routeName: 'wallet-index',
                params: {
                    symbol: network.symbol,
                    accountType: account.accountType,
                    accountIndex: 0,
                },
            }),
        );

        // start discovery
        return dispatch(fetchAndUpdateAccountThunk(coinjoinAccount.payload));
    };

type RescanCoinjoinAccountThunkState = AccountsRootState & CoinjoinRootState;

export const rescanCoinjoinAccountThunk =
    (accountKey: AccountKey, fullRescan = false) =>
    async (dispatch: Dispatch, getState: () => RescanCoinjoinAccountThunkState) => {
        const state = getState();
        const account = selectAccountByKey(state, accountKey);
        if (account?.backendType !== 'coinjoin' || account.syncing) return;
        if (selectIsAnySessionInCriticalPhase(state)) return;
        const api = await dispatch(coinjoinClientActions.initCoinjoinServiceThunk(account.symbol));
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
                { ...account, status: 'initial' as const },
                { ...EMPTY_ACCOUNT_INFO, descriptor: account.descriptor },
            ),
        );

        // start discovery
        return dispatch(fetchAndUpdateAccountThunk(payload));
    };

type AuthorizeCoinjoinThunkState = DeviceRootState;

const authorizeCoinjoinThunk =
    (account: Account, coordinator: string, params: CoinjoinSessionParameters) =>
    async (dispatch: Dispatch, getState: () => AuthorizeCoinjoinThunkState) => {
        const device = selectSelectedDevice(getState());

        // authorize coinjoin session on Trezor
        dispatch(coinjoinAccountAuthorize(account.key));

        const auth = await TrezorConnect.authorizeCoinjoin({
            device,
            path: account.path,
            coin: asCoinSymbol(account.symbol),
            coordinator,
            maxCoordinatorFeeRate: params.maxCoordinatorFeeRate * COORDINATOR_FEE_RATE_MULTIPLIER,
            maxFeePerKvbyte: params.maxFeePerKvbyte,
            maxRounds: params.maxRounds,
        });

        if (auth.success) {
            dispatch(coinjoinAccountAuthorizeSuccess(account.key, params));

            return true;
        }

        dispatch(coinjoinAccountAuthorizeFailed(account.key, auth.error.message));

        dispatch(
            notificationsActions.addToast({
                type: 'error',
                error: `Coinjoin not authorized: ${auth.error.message}`,
            }),
        );
    };

type StartCoinjoinSessionThunkState = CoinjoinRootState;

// called from coinjoin account UI
export const startCoinjoinSessionThunk =
    (account: Account, params: CoinjoinSessionParameters) =>
    async (dispatch: Dispatch, getState: () => StartCoinjoinSessionThunkState) => {
        if (account.accountType !== 'coinjoin') {
            throw new Error('startCoinjoinSession: invalid account type');
        }

        // initialize @trezor/coinjoin client
        const api = await dispatch(coinjoinClientActions.initCoinjoinServiceThunk(account.symbol));
        const coinjoinAccount = selectCoinjoinAccountByKey(getState(), account.key);

        if (!api || !coinjoinAccount) {
            return;
        }

        dispatch(coinjoinSessionStarting(account.key, true));

        // authorize CoinjoinSession on Trezor
        const authResult = await dispatch(
            authorizeCoinjoinThunk(account, api.client.settings.coordinatorName, params),
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
            dispatch(gotoThunk({ routeName: 'wallet-index', preserveParams: true }));
        }

        dispatch(coinjoinSessionStarting(account.key, false));
    };

type RestoreCoinjoinSessionThunkState = AccountsRootState &
    CoinjoinRootState &
    DeviceRootState &
    LocksRootState;

// called from coinjoin account UI
// try to restore current paused CoinjoinSession
// use same parameters as in startCoinjoinSession but recalculate maxRounds value
// if Trezor is already preauthorized it will not ask for confirmation
export const restoreCoinjoinSessionThunk =
    (accountKey: AccountKey) =>
    async (dispatch: Dispatch, getState: () => RestoreCoinjoinSessionThunkState) => {
        // TODO: check if device is connected, passphrase is authorized...
        const isDeviceLocked = selectIsDeviceLocked(getState());
        const device = selectSelectedDevice(getState());
        const account = selectAccountByKey(getState(), accountKey);

        if (!account || !isCoinjoinSupportedSymbol(account.symbol)) {
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

        if (isDeviceLocked) {
            return errorToast('Device locked');
        }

        // get @trezor/coinjoin client if available
        const client = coinjoinClientActions.getCoinjoinClient(account.symbol);
        if (!client) {
            return errorToast('CoinjoinClient is not enabled');
        }
        // get fresh data from reducer
        const coinjoinAccount = selectCoinjoinAccountByKey(getState(), account.key);
        if (!coinjoinAccount?.session) {
            return errorToast('Coinjoin account session is missing');
        }

        const { rawLiquidityClue, session } = coinjoinAccount;

        dispatch(coinjoinSessionStarting(accountKey, true));

        const auth = await TrezorConnect.authorizeCoinjoin({
            device,
            path: account.path,
            coin: asCoinSymbol(account.symbol),
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

type PauseAllCoinjoinSessionsThunkState = CoinjoinRootState;

export const pauseAllCoinjoinSessionsThunk =
    () => (dispatch: Dispatch, getState: () => PauseAllCoinjoinSessionsThunkState) => {
        const state = getState();
        const coinjoinAccounts = selectCoinjoinAccounts(state);

        coinjoinAccounts.forEach(account => {
            const hasRunningSession = selectIsAccountWithSessionByAccountKey(state, account.key);
            if (hasRunningSession) {
                dispatch(coinjoinClientActions.pauseCoinjoinSessionThunk(account.key));
            }
        });
    };

type RestorePausedCoinjoinSessionsThunkState = CoinjoinRootState &
    DeviceRootState &
    LocksRootState &
    MessageSystemRootState &
    RouterRootState &
    SelectedAccountRootState &
    SuiteOnlineRootState &
    TorRootState;

// check for blocking conditions of interrupted sessions and restore those eligible
export const restorePausedCoinjoinSessionsThunk =
    () => (dispatch: Dispatch, getState: () => RestorePausedCoinjoinSessionsThunkState) => {
        const state = getState();
        const coinjoinAccounts = selectCoinjoinAccounts(state);
        const eligibleAccounts = coinjoinAccounts.filter(({ key, session }) => {
            const hasSendFormOpen =
                selectRouteName(state) === 'wallet-send' &&
                key === state.wallet.selectedAccount.account?.key;
            const blocker = selectCoinjoinSessionBlockerByAccountKey(state, key);

            return !hasSendFormOpen && !blocker && session?.paused;
        });

        eligibleAccounts.forEach(account => dispatch(restoreCoinjoinSessionThunk(account.key)));
    };

type StopCoinjoinAccountThunkState = CoinjoinRootState;

export const stopCoinjoinAccountThunk =
    (account: Account) => (dispatch: Dispatch, getState: () => StopCoinjoinAccountThunkState) => {
        const cjAccount = selectCoinjoinAccountByKey(getState(), account.key);

        if (cjAccount?.session) {
            if ((cjAccount.session.roundPhase ?? 0) > 0) {
                dispatch(
                    coinjoinClientActions.clientEmitException(`Forget account in critical phase`, {
                        symbol: account.symbol,
                    }),
                );
            }
            dispatch(coinjoinClientActions.stopCoinjoinSessionThunk(cjAccount.key));
        }
    };

type StopCoinjoinSessionByDeviceIdThunkState = AccountsRootState &
    CoinjoinRootState &
    DeviceRootState;

export const stopCoinjoinSessionByDeviceIdThunk =
    (deviceID: string) =>
    (dispatch: Dispatch, getState: () => StopCoinjoinSessionByDeviceIdThunkState) => {
        const state = getState();

        const devices = selectDevices(state);
        const disconnectedDevices = devices.filter(d => d.id === deviceID && d.remember);
        const affectedAccounts = disconnectedDevices.flatMap(d =>
            state.wallet.accounts.filter(
                a => a.accountType === 'coinjoin' && a.deviceState === d.state?.staticSessionId,
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

                dispatch(coinjoinClientActions.stopCoinjoinSessionThunk(account.key));
            }
        });
    };

type RestoreCoinjoinAccountsThunkState = CoinjoinRootState;

export const restoreCoinjoinAccountsThunk =
    () => (dispatch: Dispatch, getState: () => RestoreCoinjoinAccountsThunkState) => {
        const { coinjoin } = getState().wallet;

        // find all networks to restore
        const coinjoinSymbols = coinjoin.accounts.reduce<NetworkSymbol[]>((res, account) => {
            if (!res.includes(account.symbol)) {
                return res.concat(account.symbol);
            }

            return res;
        }, []);

        // async actions in sequence, initialize CoinjoinCService for each network
        return promiseAllSequence(
            coinjoinSymbols.map(
                symbol => () => dispatch(coinjoinClientActions.initCoinjoinServiceThunk(symbol)),
            ),
        );
    };

type ToggleAutostopCoinjoinThunkState = CoinjoinRootState;

export const toggleAutostopCoinjoinThunk =
    (accountKey: AccountKey) =>
    (dispatch: Dispatch, getState: () => ToggleAutostopCoinjoinThunkState) => {
        const currentAccountState = selectSessionByAccountKey(getState(), accountKey);

        if (!currentAccountState) {
            return;
        }

        const newState = !currentAccountState.isAutoStopEnabled;

        dispatch(coinjoinSessionAutostop(accountKey, newState));
    };

type LogCoinjoinAccountsThunkState = CoinjoinRootState & TransactionsRootState;

export const logCoinjoinAccountsThunk =
    () => (_: Dispatch, getState: () => LogCoinjoinAccountsThunkState) => {
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
