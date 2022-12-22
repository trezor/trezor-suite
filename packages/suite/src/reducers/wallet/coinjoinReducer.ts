import produce from 'immer';
import { createSelector } from '@reduxjs/toolkit';
import { CoinjoinStatusEvent } from '@trezor/coinjoin';
import BigNumber from 'bignumber.js';
import { PartialRecord } from '@trezor/type-utils';
import { STORAGE } from '@suite-actions/constants';
import * as COINJOIN from '@wallet-actions/constants/coinjoinConstants';
import { Account } from '@suite-common/wallet-types';
import { CoinjoinAccount, RoundPhase } from '@wallet-types/coinjoin';
import { Action } from '@suite-types';
import {
    breakdownCoinjoinBalance,
    getEstimatedTimePerRound,
    transformCoinjoinStatus,
} from '@wallet-utils/coinjoinUtils';
import { ESTIMATED_ROUNDS_FAIL_RATE_BUFFER } from '@suite/services/coinjoin/config';
import { selectSelectedAccount, selectSelectedAccountParams } from './selectedAccountReducer';
import { selectDebug, selectTorState } from '@suite-reducers/suiteReducer';
import { selectAccountByKey } from '@suite-common/wallet-core';

export interface CoinjoinClientFeeRatesMedians {
    fast: number;
    recommended: number;
}

export interface CoinjoinClientInstance {
    rounds: { id: string; phase: RoundPhase }[]; // store only slice of Round in reducer. may be extended in the future
    feeRatesMedians: CoinjoinClientFeeRatesMedians;
    coordinationFeeRate: CoinjoinStatusEvent['coordinationFeeRate'];
    allowedInputAmounts: CoinjoinStatusEvent['allowedInputAmounts'];
    log: { time: number; value: string }[];
}

export interface CoinjoinState {
    accounts: CoinjoinAccount[];
    clients: PartialRecord<Account['symbol'], CoinjoinClientInstance>;
    isPreloading?: boolean;
}

export type CoinjoinRootState = {
    wallet: {
        coinjoin: CoinjoinState;
    };
};

const initialState: CoinjoinState = {
    accounts: [],
    clients: {},
    isPreloading: false,
};

type ExtractActionPayload<A> = Extract<Action, { type: A }> extends { type: A; payload: infer P }
    ? P
    : never;

const createAccount = (
    draft: CoinjoinState,
    { account, targetAnonymity }: ExtractActionPayload<typeof COINJOIN.ACCOUNT_CREATE>,
) => {
    draft.isPreloading = false;
    const exists = draft.accounts.find(a => a.key === account.key);
    if (exists) return;
    draft.accounts.push({
        key: account.key,
        symbol: account.symbol,
        rawLiquidityClue: null, // NOTE: liquidity clue is calculated from tx history. default value is `null`
        targetAnonymity,
        previousSessions: [],
    });
};

const setLiquidityClue = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.ACCOUNT_SET_LIQUIDITY_CLUE>,
) => {
    const account = draft.accounts.find(a => a.key === payload.accountKey);
    if (!account) return;
    account.rawLiquidityClue = payload.rawLiquidityClue;
};

const updateTargetAnonymity = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.ACCOUNT_UPDATE_TARGET_ANONYMITY>,
) => {
    const account = draft.accounts.find(a => a.key === payload.accountKey);
    if (!account) return;
    account.targetAnonymity = payload.targetAnonymity;
};

const createSession = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.ACCOUNT_AUTHORIZE_SUCCESS>,
) => {
    const account = draft.accounts.find(a => a.key === payload.accountKey);
    if (!account) return;
    account.session = {
        ...payload.params,
        timeCreated: Date.now(),
        // phase: 0,
        phaseDeadline: Date.now(),
        registeredUtxos: [],
        signedRounds: [],
    };
};

const updateSession = (
    draft: CoinjoinState,
    { accountKey, round }: ExtractActionPayload<typeof COINJOIN.SESSION_ROUND_CHANGED>,
) => {
    const account = draft.accounts.find(a => a.key === accountKey);
    if (!account || !account.session) return;

    const { signedRounds, maxRounds, skipRounds } = account.session;
    const { phase, phaseDeadline, roundDeadline } = round;

    const roundsLeft =
        Math.ceil(maxRounds / ESTIMATED_ROUNDS_FAIL_RATE_BUFFER) -
        signedRounds.length -
        (typeof phase === 'number' ? 1 : 0);
    const timeLeftTillRoundEnd = roundDeadline - Date.now();

    const timePerRoundInMilliseconds = getEstimatedTimePerRound(skipRounds) * 3600000;
    const sessionDeadlineRaw = Date.now() + roundsLeft * timePerRoundInMilliseconds;

    const sessionDeadline = sessionDeadlineRaw + timeLeftTillRoundEnd;

    account.session = {
        ...account.session,
        phase,
        phaseDeadline,
        sessionDeadline,
    };

    if (phase === RoundPhase.Ended) {
        delete account.session.phase;
    }
};

const signSession = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.SESSION_TX_SIGNED>,
) => {
    const account = draft.accounts.find(a => a.key === payload.accountKey);
    if (!account || !account.session) return;
    account.rawLiquidityClue = payload.rawLiquidityClue;
    account.session = {
        ...account.session,
        signedRounds: account.session.signedRounds.concat(payload.roundId),
    };
};

const completeSession = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.SESSION_COMPLETED>,
) => {
    const account = draft.accounts.find(a => a.key === payload.accountKey);
    if (!account) return;
    if (account.session) {
        account.previousSessions.push({
            ...account.session,
            timeEnded: Date.now(),
        });
        delete account.session;
    }
};

const stopSession = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.ACCOUNT_UNREGISTER>,
) => {
    const account = draft.accounts.find(a => a.key === payload.accountKey);
    if (!account) return;
    if (account.session) {
        account.previousSessions.push({
            ...account.session,
            timeEnded: Date.now(),
        });
        delete account.session;
    }
};

const pauseSession = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.SESSION_PAUSE>,
) => {
    const account = draft.accounts.find(a => a.key === payload.accountKey);
    if (!account || !account.session) return;

    delete account.session.phase;
    delete account.session.sessionDeadline;
    account.session.registeredUtxos = [];
    account.session.paused = true;
    account.session.interrupted = payload.interrupted;
    account.session.timeEnded = Date.now();
};

const restoreSession = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.SESSION_RESTORE>,
) => {
    const account = draft.accounts.find(a => a.key === payload.accountKey);
    if (!account || !account.session) return;

    delete account.session.paused;
    delete account.session.interrupted;
    delete account.session.timeEnded;
    account.session.timeCreated = Date.now();
};

// Should store at most 3 latest checkpoints, from latest to oldest
const saveCheckpoint = (
    draft: CoinjoinState,
    action: Extract<Action, { type: typeof COINJOIN.ACCOUNT_DISCOVERY_PROGRESS }>,
) => {
    const account = draft.accounts.find(a => a.key === action.payload.account.key);
    if (!account) return;
    const checkpointNew = action.payload.progress.checkpoint;
    const checkpoints = (account.checkpoints ?? [])
        .filter(({ blockHeight }) => blockHeight < checkpointNew.blockHeight)
        .slice(0, 2);
    account.checkpoints = [checkpointNew, ...checkpoints];
};

const createClient = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.CLIENT_ENABLE_SUCCESS>,
) => {
    const exists = draft.clients[payload.symbol];
    if (exists) return;
    draft.clients[payload.symbol] = {
        ...transformCoinjoinStatus(payload.status),
        log: [],
    };
};

const updateClientStatus = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.CLIENT_STATUS>,
) => {
    const client = draft.clients[payload.symbol];
    if (!client) return;
    draft.clients[payload.symbol] = {
        ...client,
        ...transformCoinjoinStatus(payload.status),
    };
};

const handleClientLog = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.CLIENT_LOG>,
) => {
    const client = draft.clients[payload.symbol];
    if (!client) return;

    // put message at 1st position
    client.log.unshift({
        time: Date.now(),
        value: payload.message,
    });
    // keep max 200 messages
    if (client.log.length > 200) {
        client.log = client.log.slice(0, 200);
    }
};

export const coinjoinReducer = (
    state: CoinjoinState = initialState,
    action: Action,
): CoinjoinState =>
    produce(state, draft => {
        switch (action.type) {
            case STORAGE.LOAD:
                draft.accounts = action.payload.coinjoinAccounts;
                break;

            case COINJOIN.ACCOUNT_CREATE:
                createAccount(draft, action.payload);
                break;
            case COINJOIN.ACCOUNT_SET_LIQUIDITY_CLUE:
                setLiquidityClue(draft, action.payload);
                break;
            case COINJOIN.ACCOUNT_REMOVE:
                draft.accounts = draft.accounts.filter(a => a.key !== action.payload.accountKey);
                break;
            case COINJOIN.ACCOUNT_UPDATE_TARGET_ANONYMITY:
                updateTargetAnonymity(draft, action.payload);
                break;
            case COINJOIN.ACCOUNT_AUTHORIZE_SUCCESS:
                createSession(draft, action.payload);
                break;
            case COINJOIN.ACCOUNT_UNREGISTER:
                stopSession(draft, action.payload);
                break;
            case COINJOIN.ACCOUNT_DISCOVERY_PROGRESS:
                saveCheckpoint(draft, action);
                break;
            case COINJOIN.ACCOUNT_PRELOADING:
                draft.isPreloading = action.payload.isPreloading;
                break;

            case COINJOIN.CLIENT_ENABLE_SUCCESS:
                createClient(draft, action.payload);
                break;
            case COINJOIN.CLIENT_DISABLE:
                delete draft.clients[action.payload.symbol];
                break;
            case COINJOIN.CLIENT_STATUS:
                updateClientStatus(draft, action.payload);
                break;

            case COINJOIN.SESSION_PAUSE:
                pauseSession(draft, action.payload);
                break;
            case COINJOIN.SESSION_RESTORE:
                restoreSession(draft, action.payload);
                break;
            case COINJOIN.SESSION_ROUND_CHANGED:
                updateSession(draft, action.payload);
                break;
            case COINJOIN.SESSION_COMPLETED:
                completeSession(draft, action.payload);
                break;

            case COINJOIN.SESSION_TX_SIGNED:
                signSession(draft, action.payload);
                break;

            case COINJOIN.CLIENT_LOG: {
                handleClientLog(draft, action.payload);
                break;
            }

            // no default
        }
    });

export const selectCoinjoinAccounts = (state: CoinjoinRootState) => state.wallet.coinjoin.accounts;

export const selectCoinjoinAccountByKey = createSelector(
    [selectCoinjoinAccounts, (_state: CoinjoinRootState, accountKey: string) => accountKey],
    (accounts, accountKey) => accounts.find(account => account.key === accountKey),
);

export const selectCurrentCoinjoinBalanceBreakdown = createSelector(
    [selectSelectedAccount, selectCoinjoinAccounts],
    (selectedAccount, coinjoinAccounts) => {
        const currentCoinjoinAccount = coinjoinAccounts.find(
            account => account.key === selectedAccount?.key,
        );

        const { targetAnonymity } = currentCoinjoinAccount || {};
        const { addresses, utxo: utxos } = selectedAccount || {};

        const balanceBreakdown = breakdownCoinjoinBalance({
            targetAnonymity,
            anonymitySet: addresses?.anonymitySet,
            utxos,
        });

        return balanceBreakdown;
    },
);

export const selectSessionProgressByAccountKey = createSelector(
    [selectCoinjoinAccountByKey, selectAccountByKey],
    (coinjoinAccount, relatedAccounts) => {
        const { targetAnonymity } = coinjoinAccount || {};
        const { addresses, balance, utxo: utxos } = relatedAccounts || {};

        if (!balance || !utxos) {
            return 0;
        }

        const { anonymized } = breakdownCoinjoinBalance({
            targetAnonymity,
            anonymitySet: addresses?.anonymitySet,
            utxos,
        });

        const progress = new BigNumber(anonymized)
            .div(new BigNumber(balance).div(100))
            .integerValue()
            .toNumber();

        return progress;
    },
);

export const selectCurrentCoinjoinSession = createSelector(
    [selectSelectedAccount, selectCoinjoinAccounts],
    (selectedAccount, coinjoinAccounts) => {
        const currentCoinjoinAccount = coinjoinAccounts.find(
            account => account.key === selectedAccount?.key,
        );

        const { session } = currentCoinjoinAccount || {};

        return session;
    },
);

export const selectCurrentTargetAnonymity = createSelector(
    [selectSelectedAccount, selectCoinjoinAccounts],
    (selectedAccount, coinjoinAccounts) => {
        const currentCoinjoinAccount = coinjoinAccounts.find(
            account => account.key === selectedAccount?.key,
        );

        const { targetAnonymity } = currentCoinjoinAccount || {};

        return targetAnonymity;
    },
);

export const selectIsCoinjoinBlockedByTor = createSelector(
    [selectSelectedAccountParams, selectTorState, selectDebug],
    (accountParams, { isTorEnabled }, debug) => {
        if (!accountParams) {
            return false;
        }

        if (debug.coinjoinAllowNoTor) {
            return false;
        }

        return accountParams.accountType === 'coinjoin' && !isTorEnabled;
    },
);
