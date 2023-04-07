import produce from 'immer';
import { memoizeWithArgs, memoize } from 'proxy-memoize';
import BigNumber from 'bignumber.js';

import { CoinjoinStatusEvent, getInputSize, getOutputSize } from '@trezor/coinjoin';
import { PartialRecord } from '@trezor/type-utils';
import { STORAGE } from '@suite-actions/constants';
import { Account, AccountKey } from '@suite-common/wallet-types';
import {
    CoinjoinAccount,
    RoundPhase,
    CoinjoinDebugSettings,
    CoinjoinConfig,
} from '@wallet-types/coinjoin';
import { COINJOIN } from '@wallet-actions/constants';
import { Action } from '@suite-types';
import {
    selectDeviceState,
    selectIsDeviceLocked,
    selectTorState,
    SuiteRootState,
} from '@suite-reducers/suiteReducer';
import {
    breakdownCoinjoinBalance,
    calculateAnonymityProgress,
    getMaxFeePerVbyte,
    cleanAnonymityGains,
    getRoundPhaseFromSessionPhase,
    transformCoinjoinStatus,
    calculateAverageAnonymityGainPerRound,
} from '@wallet-utils/coinjoinUtils';
import {
    CLIENT_STATUS_FALLBACK,
    ESTIMATED_ANONYMITY_GAINED_PER_ROUND,
    MIN_ANONYMITY_GAINED_PER_ROUND,
    ESTIMATED_ROUNDS_FAIL_RATE_BUFFER,
    ESTIMATED_HOURS_PER_ROUND,
    UNECONOMICAL_COINJOIN_THRESHOLD,
    DEFAULT_TARGET_ANONYMITY,
    SKIP_ROUNDS_BY_DEFAULT,
    WEEKLY_FEE_RATE_MEDIAN_FALLBACK,
} from '@suite/services/coinjoin';
import { accountsActions, AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import {
    Feature,
    MessageSystemRootState,
    selectIsFeatureDisabled,
    selectFeatureConfig,
} from '@suite-reducers/messageSystemReducer';
import { SelectedAccountRootState, selectSelectedAccount } from './selectedAccountReducer';

export interface CoinjoinClientInstance
    extends Pick<
        CoinjoinStatusEvent,
        'coordinationFeeRate' | 'allowedInputAmounts' | 'weeklyFeeRateMedian'
    > {
    rounds: { id: string; phase: RoundPhase }[]; // store only slice of Round in reducer. may be extended in the future
    status: 'loading' | 'loaded';
}

export interface CoinjoinState {
    accounts: CoinjoinAccount[];
    clients: PartialRecord<Account['symbol'], CoinjoinClientInstance>;
    isPreloading?: boolean;
    debug?: CoinjoinDebugSettings;
    config: CoinjoinConfig;
}

export type CoinjoinRootState = {
    wallet: {
        coinjoin: CoinjoinState;
    };
} & AccountsRootState &
    SelectedAccountRootState &
    SuiteRootState &
    MessageSystemRootState;

export const initialState: CoinjoinState = {
    accounts: [],
    clients: {},
    isPreloading: false,
    config: {
        averageAnonymityGainPerRound: ESTIMATED_ANONYMITY_GAINED_PER_ROUND,
        roundsFailRateBuffer: ESTIMATED_ROUNDS_FAIL_RATE_BUFFER,
        roundsDurationInHours: ESTIMATED_HOURS_PER_ROUND,
    },
};

type ExtractActionPayload<A> = Extract<Action, { type: A }> extends { type: A; payload: infer P }
    ? P
    : never;

const getAccount = (draft: CoinjoinState, accountKey: string) =>
    draft.accounts.find(a => a.key === accountKey);

const createAccount = (
    draft: CoinjoinState,
    account: ExtractActionPayload<typeof accountsActions.createAccount.type>,
) => {
    draft.isPreloading = false;
    const coinjoinAccount = {
        key: account.key,
        symbol: account.symbol,
        rawLiquidityClue: null, // NOTE: liquidity clue is calculated from tx history. default value is `null`
        previousSessions: [],
    };
    const index = draft.accounts.findIndex(a => a.key === account.key);
    if (index < 0) draft.accounts.push(coinjoinAccount);
    else draft.accounts[index] = coinjoinAccount;
};

const setLiquidityClue = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.ACCOUNT_SET_LIQUIDITY_CLUE>,
) => {
    const account = getAccount(draft, payload.accountKey);
    if (!account) return;
    account.rawLiquidityClue = payload.rawLiquidityClue;
};

const updateSetupOption = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.ACCOUNT_UPDATE_SETUP_OPTION>,
) => {
    const account = getAccount(draft, payload.accountKey);
    if (!account) return;
    if (payload.isRecommended) {
        delete account.setup;
    } else {
        const client = draft.clients[account.symbol];
        const weeklyFeeRateMedian = client?.weeklyFeeRateMedian || WEEKLY_FEE_RATE_MEDIAN_FALLBACK;
        account.setup = {
            maxFeePerVbyte: getMaxFeePerVbyte(weeklyFeeRateMedian),
            skipRounds: SKIP_ROUNDS_BY_DEFAULT,
            targetAnonymity: DEFAULT_TARGET_ANONYMITY,
        };
    }
};

const updateTargetAnonymity = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.ACCOUNT_UPDATE_TARGET_ANONYMITY>,
) => {
    const account = getAccount(draft, payload.accountKey);
    if (!account?.setup) return;
    account.setup.targetAnonymity = payload.targetAnonymity;
};

const updateMaxMingFee = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.ACCOUNT_UPDATE_MAX_MING_FEE>,
) => {
    const account = getAccount(draft, payload.accountKey);
    if (!account?.setup) return;
    account.setup.maxFeePerVbyte = payload.maxFeePerVbyte;
};

const toggleSkipRounds = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.ACCOUNT_TOGGLE_SKIP_ROUNDS>,
) => {
    const account = getAccount(draft, payload.accountKey);
    if (!account?.setup) return;
    account.setup.skipRounds = !account.setup.skipRounds;
};

const createSession = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.ACCOUNT_AUTHORIZE_SUCCESS>,
) => {
    const account = getAccount(draft, payload.accountKey);
    if (!account) return;
    account.session = {
        ...payload.params,
        timeCreated: Date.now(),
        sessionPhaseQueue: [],
        signedRounds: [],
    };
};

const updateSession = (
    draft: CoinjoinState,
    {
        accountKey,
        round,
        sessionDeadline,
    }: ExtractActionPayload<typeof COINJOIN.SESSION_ROUND_CHANGED>,
) => {
    const account = getAccount(draft, accountKey);
    if (!account || !account.session) return;

    const { roundPhase } = account.session;
    const { phase, phaseDeadline } = round;

    if (typeof roundPhase !== 'undefined' && roundPhase !== phase) {
        account.session.sessionPhaseQueue = [];
    }

    account.session = {
        ...account.session,
        roundPhase: phase,
        roundPhaseDeadline: phaseDeadline,
        sessionDeadline,
    };

    if (phase === RoundPhase.Ended) {
        delete account.session.roundPhase;
    }
};

const sessionTxSigned = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.SESSION_TX_SIGNED>,
) => {
    const account = getAccount(draft, payload.accountKey);
    if (!account || !account.session) return;
    account.rawLiquidityClue = payload.rawLiquidityClue;
    account.session = {
        ...account.session,
        signedRounds: account.session.signedRounds.concat(payload.roundId),
    };
};

const updateSessionStarting = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.SESSION_STARTING>,
) => {
    const account = getAccount(draft, payload.accountKey);
    if (!account || !account.session) return;
    if (payload.isStarting) {
        account.session = {
            ...account.session,
            starting: payload.isStarting,
        };
    } else {
        delete account.session.starting;
    }
};

const completeSession = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.SESSION_COMPLETED>,
) => {
    const account = getAccount(draft, payload.accountKey);
    if (!account) return;
    if (account.session) {
        account.previousSessions.push({
            ...account.session,
            timeEnded: Date.now(),
            sessionPhaseQueue: [],
        });
        delete account.session;
    }
};

const stopSession = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.ACCOUNT_UNREGISTER>,
) => {
    const account = getAccount(draft, payload.accountKey);
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
    const account = getAccount(draft, payload.accountKey);
    if (!account || !account.session) return;

    delete account.session.roundPhase;
    delete account.session.sessionDeadline;
    account.session.sessionPhaseQueue = [];
    account.session.paused = true;
    account.session.interrupted = payload.interrupted;
    account.session.timeEnded = Date.now();
};

const restoreSession = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.SESSION_RESTORE>,
) => {
    const account = getAccount(draft, payload.accountKey);
    if (!account || !account.session) return;

    delete account.session.paused;
    delete account.session.interrupted;
    delete account.session.isAutoPauseEnabled;
    delete account.session.timeEnded;
    account.session.timeCreated = Date.now();
};

// Should store at most 3 latest checkpoints, from latest to oldest
const saveCheckpoint = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.ACCOUNT_DISCOVERY_PROGRESS>,
) => {
    const account = getAccount(draft, payload.accountKey);
    if (!account) return;
    const checkpointNew = payload.progress.checkpoint;
    const checkpoints = (account.checkpoints ?? [])
        .filter(({ blockHeight }) => blockHeight < checkpointNew.blockHeight)
        .slice(0, 2);
    account.checkpoints = [checkpointNew, ...checkpoints];
};

const initClient = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.CLIENT_ENABLE>,
) => {
    const exists = draft.clients[payload.symbol];
    if (exists) return;
    draft.clients[payload.symbol] = {
        ...CLIENT_STATUS_FALLBACK,
        status: 'loading',
    };
};

const createClient = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.CLIENT_ENABLE_SUCCESS>,
) => {
    draft.clients[payload.symbol] = {
        ...transformCoinjoinStatus(payload.status),
        status: 'loaded',
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

const updateSessionPhase = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.CLIENT_SESSION_PHASE>,
) => {
    const accounts = payload.accountKeys?.flatMap(
        accountKey => getAccount(draft, accountKey) || [],
    );

    if (!accounts || !accounts.length) {
        return;
    }

    const { phase } = payload;

    accounts.forEach(({ session }) => {
        if (!session) {
            return;
        }
        const previousSessionPhase = session.sessionPhaseQueue.at(-1) ?? 0;
        const roundPhase = getRoundPhaseFromSessionPhase(phase);
        const isFirstRoundPhase = roundPhase === RoundPhase.InputRegistration;

        // Allow only subsequent session phases
        // or phases from the first round phase if they are not the same as current one.
        if (phase > previousSessionPhase || (isFirstRoundPhase && phase !== previousSessionPhase)) {
            session.sessionPhaseQueue.push(phase);
        }
    });
};

const updateDebugMode = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.SET_DEBUG_SETTINGS>,
) => {
    if (payload.coinjoinServerEnvironment && draft.debug?.coinjoinServerEnvironment) {
        draft.debug.coinjoinServerEnvironment = {
            ...draft.debug.coinjoinServerEnvironment,
            ...payload.coinjoinServerEnvironment,
        };
    } else {
        draft.debug = {
            ...draft.debug,
            ...payload,
        };
    }
};

const enableSessionAutopause = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.SESSION_AUTOPAUSE>,
) => {
    const session = getAccount(draft, payload.accountKey)?.session;

    if (!session) {
        return;
    }

    session.isAutoPauseEnabled = payload.isAutopaused;
};

const addAnonymityLevel = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.ACCOUNT_ADD_ANONYMITY_LEVEL>,
) => {
    const account = getAccount(draft, payload.accountKey);
    if (!account) return;
    if (!account.anonymityGains) {
        account.anonymityGains = {
            history: [],
        };
    }
    account.anonymityGains.history.unshift({ level: payload.level, timestamp: Date.now() });
    account.anonymityGains.history = cleanAnonymityGains(account.anonymityGains.history);
};

const updateLastReportTimestamp = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.ACCOUNT_UPDATE_LAST_REPORT_TIMESTAMP>,
) => {
    const account = getAccount(draft, payload.accountKey);
    if (!account?.anonymityGains) return;
    account.anonymityGains.lastReportTimestamp = Date.now();
};

export const coinjoinReducer = (
    state: CoinjoinState = initialState,
    action: Action,
): CoinjoinState =>
    produce(state, draft => {
        switch (action.type) {
            case STORAGE.LOAD:
                draft.accounts = action.payload.coinjoinAccounts;
                draft.debug = action.payload.coinjoinDebugSettings;
                break;

            case COINJOIN.SET_DEBUG_SETTINGS:
                updateDebugMode(draft, action.payload);
                break;

            case accountsActions.createAccount.type:
                if (action.payload.accountType === 'coinjoin') {
                    createAccount(draft, action.payload);
                }
                break;
            case COINJOIN.ACCOUNT_SET_LIQUIDITY_CLUE:
                setLiquidityClue(draft, action.payload);
                break;
            case accountsActions.removeAccount.type:
                draft.accounts = draft.accounts.filter(
                    a => !action.payload.some(acc => a.key === acc.key),
                );
                break;
            case COINJOIN.ACCOUNT_UPDATE_SETUP_OPTION:
                updateSetupOption(draft, action.payload);
                break;
            case COINJOIN.ACCOUNT_UPDATE_TARGET_ANONYMITY:
                updateTargetAnonymity(draft, action.payload);
                break;
            case COINJOIN.ACCOUNT_UPDATE_MAX_MING_FEE:
                updateMaxMingFee(draft, action.payload);
                break;
            case COINJOIN.ACCOUNT_TOGGLE_SKIP_ROUNDS:
                toggleSkipRounds(draft, action.payload);
                break;
            case COINJOIN.ACCOUNT_AUTHORIZE_SUCCESS:
                createSession(draft, action.payload);
                break;
            case COINJOIN.ACCOUNT_UNREGISTER:
                stopSession(draft, action.payload);
                break;
            case COINJOIN.ACCOUNT_DISCOVERY_PROGRESS:
                saveCheckpoint(draft, action.payload);
                break;
            case COINJOIN.ACCOUNT_PRELOADING:
                draft.isPreloading = action.payload.isPreloading;
                break;

            case COINJOIN.CLIENT_ENABLE:
                initClient(draft, action.payload);
                break;
            case COINJOIN.CLIENT_ENABLE_SUCCESS:
                createClient(draft, action.payload);
                break;
            case COINJOIN.CLIENT_DISABLE:
            case COINJOIN.CLIENT_ENABLE_FAILED:
                delete draft.clients[action.payload.symbol];
                break;
            case COINJOIN.CLIENT_STATUS:
                updateClientStatus(draft, action.payload);
                break;
            case COINJOIN.CLIENT_SESSION_PHASE:
                updateSessionPhase(draft, action.payload);
                break;
            case COINJOIN.SESSION_PAUSE:
                pauseSession(draft, action.payload);
                break;
            case COINJOIN.SESSION_AUTOPAUSE:
                enableSessionAutopause(draft, action.payload);
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
                sessionTxSigned(draft, action.payload);
                break;
            case COINJOIN.SESSION_STARTING:
                updateSessionStarting(draft, action.payload);
                break;
            case COINJOIN.UPDATE_CONFIG:
                draft.config = {
                    ...draft.config,
                    ...action.payload,
                };
                break;
            case COINJOIN.ACCOUNT_ADD_ANONYMITY_LEVEL:
                addAnonymityLevel(draft, action.payload);
                break;
            case COINJOIN.ACCOUNT_UPDATE_LAST_REPORT_TIMESTAMP:
                updateLastReportTimestamp(draft, action.payload);
                break;
            // no default
        }
    });

export const selectCoinjoinAccounts = (state: CoinjoinRootState) => state.wallet.coinjoin.accounts;

export const selectCoinjoinClients = (state: CoinjoinRootState) => state.wallet.coinjoin.clients;

export const selectRoundsDurationInHours = (state: CoinjoinRootState) =>
    state.wallet.coinjoin.config.roundsDurationInHours;

export const selectRoundsFailRateBuffer = (state: CoinjoinRootState) =>
    state.wallet.coinjoin.config.roundsFailRateBuffer;

export const selectCoinjoinAccountByKey = memoizeWithArgs(
    (state: CoinjoinRootState, accountKey: AccountKey) => {
        const coinjoinAccounts = selectCoinjoinAccounts(state);
        return coinjoinAccounts.find(account => account.key === accountKey);
    },
);

export const selectCoinjoinClient = memoizeWithArgs(
    (state: CoinjoinRootState, accountKey: AccountKey) => {
        const coinjoinAccount = selectCoinjoinAccountByKey(state, accountKey);
        const clients = selectCoinjoinClients(state);
        return coinjoinAccount?.symbol && clients[coinjoinAccount?.symbol];
    },
);

export const selectSessionByAccountKey = memoizeWithArgs(
    (state: CoinjoinRootState, accountKey: AccountKey) => {
        const coinjoinAccounts = selectCoinjoinAccounts(state);
        return coinjoinAccounts.find(account => account.key === accountKey)?.session;
    },
);

export const selectTargetAnonymityByAccountKey = (
    state: CoinjoinRootState,
    accountKey: AccountKey,
) => {
    const coinjoinAccount = selectCoinjoinAccountByKey(state, accountKey);
    if (!coinjoinAccount) return;
    return coinjoinAccount.setup?.targetAnonymity ?? DEFAULT_TARGET_ANONYMITY;
};

export const selectCurrentCoinjoinBalanceBreakdown = memoize((state: CoinjoinRootState) => {
    const selectedAccount = selectSelectedAccount(state);
    const targetAnonymity = selectedAccount
        ? selectTargetAnonymityByAccountKey(state, selectedAccount.key)
        : undefined;

    const { addresses, utxo: utxos } = selectedAccount || {};

    const balanceBreakdown = breakdownCoinjoinBalance({
        targetAnonymity,
        anonymitySet: addresses?.anonymitySet,
        utxos,
    });

    return balanceBreakdown;
});

export const selectSessionProgressByAccountKey = memoizeWithArgs(
    (state: CoinjoinRootState, accountKey: AccountKey) => {
        const relatedAccount = selectAccountByKey(state, accountKey);
        const targetAnonymity = selectTargetAnonymityByAccountKey(state, accountKey);

        const { addresses, balance, utxo: utxos } = relatedAccount || {};

        if (!balance || !utxos) {
            return 0;
        }

        const progress = calculateAnonymityProgress({
            targetAnonymity,
            anonymitySet: addresses?.anonymitySet,
            utxos,
        });

        return progress;
    },
);

export const selectCurrentCoinjoinSession = memoize((state: CoinjoinRootState) => {
    const selectedAccount = selectSelectedAccount(state);
    const coinjoinAccounts = selectCoinjoinAccounts(state);

    const currentCoinjoinAccount = coinjoinAccounts.find(
        account => account.key === selectedAccount?.key,
    );

    const { session } = currentCoinjoinAccount || {};

    return session;
});

export const selectCurrentTargetAnonymity = (state: CoinjoinRootState) => {
    const selectedAccount = selectSelectedAccount(state);
    const targetAnonymity = selectedAccount
        ? selectTargetAnonymityByAccountKey(state, selectedAccount.key)
        : undefined;

    return targetAnonymity;
};

export const selectIsCoinjoinBlockedByTor = memoize((state: CoinjoinRootState) => {
    const { isTorEnabled } = selectTorState(state);

    if (state.wallet.coinjoin.debug?.coinjoinAllowNoTor) {
        return false;
    }

    return !isTorEnabled;
});

export const selectIsAnySessionInCriticalPhase = memoize((state: CoinjoinRootState) => {
    const coinjoinAccounts = selectCoinjoinAccounts(state);

    return coinjoinAccounts.some(acc => (acc.session?.roundPhase ?? 0) > 0);
});

export const selectIsAccountWithSessionInCriticalPhaseByAccountKey = memoizeWithArgs(
    (state: CoinjoinRootState, accountKey: AccountKey) => {
        const coinjoinAccount = selectCoinjoinAccountByKey(state, accountKey);
        return (coinjoinAccount?.session?.roundPhase ?? 0) > 0;
    },
);

export const selectIsAccountWithSessionByAccountKey = memoizeWithArgs(
    (state: CoinjoinRootState, accountKey: AccountKey) => {
        const coinjoinAccounts = selectCoinjoinAccounts(state);
        return coinjoinAccounts.find(a => a.key === accountKey && a.session && !a.session.paused);
    },
);

export const selectWeeklyFeeRateMedianByAccountKey = (
    state: CoinjoinRootState,
    accountKey: AccountKey,
) => {
    const coinjoinClient = selectCoinjoinClient(state, accountKey);
    return coinjoinClient?.weeklyFeeRateMedian || WEEKLY_FEE_RATE_MEDIAN_FALLBACK;
};

export const selectDefaultMaxMiningFeeByAccountKey = (
    state: CoinjoinRootState,
    accountKey: AccountKey,
) => {
    const weeklyFeeRateMedian = selectWeeklyFeeRateMedianByAccountKey(state, accountKey);
    return getMaxFeePerVbyte(weeklyFeeRateMedian);
};

export const selectMinAllowedInputWithFee = (state: CoinjoinRootState, accountKey: AccountKey) => {
    const coinjoinClient = selectCoinjoinClient(state, accountKey);
    const status = coinjoinClient || CLIENT_STATUS_FALLBACK;
    const minAllowedInput = status.allowedInputAmounts.min;
    const txSize = getInputSize('Taproot') + getOutputSize('Taproot');
    // Add estimated fee based on weekly median fee rate.
    return minAllowedInput + txSize * status.weeklyFeeRateMedian;
};

export const selectIsNothingToAnonymizeByAccountKey = memoizeWithArgs(
    (state: CoinjoinRootState, accountKey: AccountKey) => {
        const minAllowedInputWithFee = selectMinAllowedInputWithFee(state, accountKey);
        const account = selectAccountByKey(state, accountKey);
        const targetAnonymity = selectTargetAnonymityByAccountKey(state, accountKey) ?? 1;

        const anonymitySet = account?.addresses?.anonymitySet || {};
        const utxos = account?.utxo || [];

        // Return true if all non-private funds are too small.
        return utxos
            .filter(utxo => (anonymitySet[utxo.address] ?? 1) < targetAnonymity)
            .every(utxo => new BigNumber(utxo.amount).lt(minAllowedInputWithFee));
    },
);

export const selectWeightedAnonymityByAccountKey = (
    state: CoinjoinRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    const targetAnonymity = selectTargetAnonymityByAccountKey(state, accountKey) || 0;

    const anonymitySet = account?.addresses?.anonymitySet || {};
    const utxos = account?.utxo || [];
    const weightedAnonymitySum = BigNumber.sum(
        ...utxos.map(utxo =>
            new BigNumber(utxo.amount).times(
                Math.min(targetAnonymity, anonymitySet[utxo.address] || 1),
            ),
        ),
    );
    const amountsSum = BigNumber.sum(...utxos.map(utxo => utxo.amount));

    return amountsSum.isZero() ? 1 : weightedAnonymitySum.div(amountsSum).toNumber();
};

export const selectRoundsNeededByAccountKey = (
    state: CoinjoinRootState,
    accountKey: AccountKey,
) => {
    const coinjoinAccount = selectCoinjoinAccountByKey(state, accountKey);
    const targetAnonymity = selectTargetAnonymityByAccountKey(state, accountKey) || 0;
    const weightedAnonymity = selectWeightedAnonymityByAccountKey(state, accountKey);
    const defaultAnonymityGainPerRound = state.wallet.coinjoin.config.averageAnonymityGainPerRound;

    const averageAnonymityGainPerRound = calculateAverageAnonymityGainPerRound(
        defaultAnonymityGainPerRound,
        coinjoinAccount?.anonymityGains?.history,
    );

    return Math.ceil(
        (targetAnonymity - weightedAnonymity) /
            Math.max(averageAnonymityGainPerRound, MIN_ANONYMITY_GAINED_PER_ROUND),
    );
};

export const selectAnonymityGainToReportByAccountKey = (
    state: CoinjoinRootState,
    accountKey: AccountKey,
) => {
    const coinjoinAccount = selectCoinjoinAccountByKey(state, accountKey);
    const lastReport = coinjoinAccount?.anonymityGains?.lastReportTimestamp;

    if (!coinjoinAccount?.anonymityGains) {
        return null;
    }

    const anonymityGains = cleanAnonymityGains(coinjoinAccount.anonymityGains.history);

    // Report only results not reported before.
    const gainsToReport = lastReport
        ? anonymityGains.filter(level => level.timestamp > lastReport)
        : anonymityGains;

    if (!gainsToReport.length) {
        return null;
    }

    // Report average value. Reporting values per round would compromise data privacy.
    return (
        gainsToReport.reduce((total, current) => total + current.level, 0) / gainsToReport.length
    );
};

export const selectRoundsLeftByAccountKey = (state: CoinjoinRootState, accountKey: AccountKey) => {
    const coinjoinSession = selectSessionByAccountKey(state, accountKey);

    if (!coinjoinSession) {
        return 0;
    }

    const { maxRounds, signedRounds } = coinjoinSession;

    return maxRounds - signedRounds.length;
};

export const selectHasAnonymitySetError = memoize((state: CoinjoinRootState) => {
    const selectedAccount = selectSelectedAccount(state);

    if (!selectedAccount) {
        return false;
    }

    const { addresses, utxo: utxos } = selectedAccount;

    const hasFaultyAnonymitySet = !utxos?.every(
        ({ address }) => addresses?.anonymitySet?.[address] !== undefined,
    );

    return hasFaultyAnonymitySet;
});

export const selectCoinjoinSessionBlockerByAccountKey = memoizeWithArgs(
    (state: CoinjoinRootState, accountKey: AccountKey) => {
        if (selectSessionByAccountKey(state, accountKey)?.starting) {
            return 'SESSION_STARTING';
        }
        if (selectIsFeatureDisabled(state, Feature.coinjoin)) {
            return 'FEATURE_DISABLED';
        }
        if (!state.suite.online) {
            return 'OFFLINE';
        }
        if (selectIsNothingToAnonymizeByAccountKey(state, accountKey)) {
            return 'NOTHING_TO_ANONYMIZE';
        }
        if (selectIsCoinjoinBlockedByTor(state)) {
            return 'TOR_DISABLED';
        }
        if (selectDeviceState(state) !== 'connected') {
            return 'DEVICE_DISCONNECTED';
        }
        const account = selectAccountByKey(state, accountKey);
        if (account?.backendType === 'coinjoin' && account?.status === 'out-of-sync') {
            return 'ACCOUNT_OUT_OF_SYNC';
        }
        if (selectIsDeviceLocked(state)) {
            return 'DEVICE_LOCKED';
        }
        if (selectHasAnonymitySetError(state)) {
            return 'ANONYMITY_ERROR';
        }
    },
);

// memoise() was causing incorrect return from the selector
export const selectCurrentCoinjoinWheelStates = (state: CoinjoinRootState) => {
    const { notAnonymized } = selectCurrentCoinjoinBalanceBreakdown(state);
    const session = selectCurrentCoinjoinSession(state);
    const { key, balance } = selectSelectedAccount(state) || {};
    const sessionProgress = selectSessionProgressByAccountKey(state, key || '');

    const coinjoinSessionBlocker = selectCoinjoinSessionBlockerByAccountKey(state, key || '');

    const { paused } = session || {};

    // session states
    const isSessionActive = !!session;
    const isPaused = !!paused;
    const isLoading = coinjoinSessionBlocker === 'SESSION_STARTING';

    // account states
    const isAccountEmpty = !balance || balance === '0';
    const isNonePrivate = sessionProgress === 0;
    const isAllPrivate = notAnonymized === '0';
    const isCoinjoinUneco = !!balance && new BigNumber(balance).lt(UNECONOMICAL_COINJOIN_THRESHOLD);

    // error state
    const isResumeBlockedByLastingIssue =
        !!coinjoinSessionBlocker &&
        !['DEVICE_LOCKED', 'SESSION_STARTING'].includes(coinjoinSessionBlocker);

    return {
        isSessionActive,
        isPaused,
        isLoading,
        isAccountEmpty,
        isNonePrivate,
        isAllPrivate,
        isResumeBlockedByLastingIssue,
        isCoinjoinUneco,
    };
};

export const selectCurrentSessionDeadlineInfo = memoize((state: CoinjoinRootState) => {
    const session = selectCurrentCoinjoinSession(state);

    const { roundPhase, roundPhaseDeadline, sessionDeadline } = session || {};

    return {
        roundPhase,
        roundPhaseDeadline,
        sessionDeadline,
    };
});

// Return true if it's not explicitly set to false in the message-system config.
export const selectIsPublic = memoize(
    (state: CoinjoinRootState) => selectFeatureConfig(state, Feature.coinjoin)?.isPublic !== false,
);

export const selectIsSessionAutopaused = memoizeWithArgs(
    (state: CoinjoinRootState, accountKey: string) => {
        const currentState = selectSessionByAccountKey(state, accountKey);

        return !!currentState?.isAutoPauseEnabled;
    },
);
