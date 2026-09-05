import { produce } from 'immer';

import { accountsActions } from '@suite-common/wallet-core';
import { RoundPhase } from '@trezor/coinjoin';

import { type CoinjoinAccountAction } from './coinjoinAccountActions';
import { type CoinjoinClientAction } from './coinjoinClientActions';
import * as COINJOIN from './coinjoinConstants';
import {
    type CoinjoinAccount,
    type CoinjoinDebugSettings,
    type CoinjoinState,
} from './coinjoinTypes';
import {
    cleanAnonymityGains,
    getMaxFeePerVbyte,
    getRoundPhaseFromSessionPhase,
    transformCoinjoinStatus,
} from './coinjoinUtils';
import {
    CLIENT_STATUS_FALLBACK,
    DEFAULT_TARGET_ANONYMITY,
    ESTIMATED_ANONYMITY_GAINED_PER_ROUND,
    ESTIMATED_HOURS_PER_ROUND,
    ESTIMATED_ROUNDS_FAIL_RATE_BUFFER,
    FEE_RATE_MEDIAN_FALLBACK,
    MAX_MINING_FEE_MODIFIER,
    SKIP_ROUNDS_BY_DEFAULT,
    TREZOR_LEGAL_DOCUMENTS_VERSION,
    ZKSNACKS_LEGAL_DOCUMENTS_VERSION,
} from './config';

// '@storage/load' is a suite app action; typed by literal to avoid a dependency on the app
type StorageLoadCoinjoinAction = {
    type: '@storage/load';
    payload: {
        coinjoinAccounts: CoinjoinAccount[];
        coinjoinDebugSettings?: CoinjoinDebugSettings;
    };
};

export type CoinjoinAction =
    | CoinjoinAccountAction
    | CoinjoinClientAction
    | StorageLoadCoinjoinAction
    | ReturnType<typeof accountsActions.createAccount>
    | ReturnType<typeof accountsActions.removeAccount>;

export const initialState: CoinjoinState = {
    accounts: [],
    clients: {},
    isPreloading: false,
    config: {
        averageAnonymityGainPerRound: ESTIMATED_ANONYMITY_GAINED_PER_ROUND,
        roundsFailRateBuffer: ESTIMATED_ROUNDS_FAIL_RATE_BUFFER,
        roundsDurationInHours: ESTIMATED_HOURS_PER_ROUND,
        maxMiningFeeModifier: MAX_MINING_FEE_MODIFIER,
        maxFeePerVbyte: undefined,
        legalDocumentsVersion: TREZOR_LEGAL_DOCUMENTS_VERSION,
    },
};

type ExtractActionPayload<A> =
    Extract<CoinjoinAction, { type: A }> extends { type: A; payload: infer P } ? P : never;

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
        const feeRateMedian = client?.feeRateMedian || FEE_RATE_MEDIAN_FALLBACK;
        const { maxMiningFeeModifier } = draft.config;
        account.setup = {
            maxFeePerVbyte: getMaxFeePerVbyte(feeRateMedian, maxMiningFeeModifier),
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
    account.agreedToLegalDocumentVersions = {
        trezor: draft.config.legalDocumentsVersion,
        zkSNACKs:
            draft.clients[account.symbol]?.version?.legalDocumentsVersion ??
            ZKSNACKS_LEGAL_DOCUMENTS_VERSION,
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
    if (!account?.session) return;

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
    if (!account?.session) return;
    account.rawLiquidityClue = payload.rawLiquidityClue;
    account.session = {
        ...account.session,
        signedRounds: account.session.signedRounds.concat(payload.roundId),
    };
};

const addTxCandidate = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.SESSION_TX_CANDIDATE>,
) => {
    const account = getAccount(draft, payload.accountKey);
    if (!account) return;
    if (!account.transactionCandidates) {
        account.transactionCandidates = [];
    }
    if (!account.transactionCandidates.some(tx => tx.roundId === payload.roundId)) {
        account.transactionCandidates.push({ roundId: payload.roundId });
    }
};

const removeTxCandidate = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.SESSION_TX_BROADCASTED>,
) => {
    payload.accountKeys.forEach(key => {
        const account = getAccount(draft, key);
        if (account?.transactionCandidates) {
            account.transactionCandidates = account.transactionCandidates.filter(
                tx => tx.roundId !== payload.round.id,
            );
            if (account.transactionCandidates.length < 1) {
                delete account.transactionCandidates;
            }
        }
    });
};

const updateSessionStarting = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.SESSION_STARTING>,
) => {
    const account = getAccount(draft, payload.accountKey);
    if (!account?.session) return;
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
    if (account?.session) {
        delete account.session;
    }
};

const stopSession = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.ACCOUNT_UNREGISTER>,
) => {
    const account = getAccount(draft, payload.accountKey);
    if (account?.session) {
        delete account.session;
    }
};

const pauseSession = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.SESSION_PAUSE>,
) => {
    const account = getAccount(draft, payload.accountKey);
    if (!account?.session) return;

    delete account.session.roundPhase;
    delete account.session.sessionDeadline;
    account.session.sessionPhaseQueue = [];
    account.session.paused = true;
    account.session.timeEnded = Date.now();
};

const restoreSession = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.SESSION_RESTORE>,
) => {
    const account = getAccount(draft, payload.accountKey);
    if (!account?.session) return;

    delete account.session.paused;
    delete account.session.isAutoStopEnabled;
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
        version: payload.version,
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

const updateAccountPrison = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.CLIENT_PRISON_EVENT>,
) => {
    draft.accounts.forEach(account => {
        const accountPrison = payload.filter(inmate => inmate.accountKey === account.key);
        account.prison = accountPrison.reduce<NonNullable<CoinjoinAccount['prison']>>(
            (prison, inmate) => {
                if (['input', 'output'].includes(inmate.type)) {
                    // remove duplicated info (id, accountKey)
                    const { id, accountKey, ...rest } = inmate;
                    prison[id] = rest;
                }

                return prison;
            },
            {},
        );
    });
};

const updateSessionPhase = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.CLIENT_SESSION_PHASE>,
) => {
    const accounts = payload.accountKeys?.flatMap(
        accountKey => getAccount(draft, accountKey) || [],
    );

    if (!accounts?.length) {
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

const enableSessionAutostop = (
    draft: CoinjoinState,
    payload: ExtractActionPayload<typeof COINJOIN.SESSION_AUTOSTOP>,
) => {
    const session = getAccount(draft, payload.accountKey)?.session;

    if (!session) {
        return;
    }

    session.isAutoStopEnabled = payload.isAutostopped;
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
    action: CoinjoinAction,
): CoinjoinState =>
    produce(state, draft => {
        switch (action.type) {
            case '@storage/load': // hack: to prevent dependency
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
            case COINJOIN.ACCOUNT_DISCOVERY_RESET: {
                const account = getAccount(draft, action.payload.accountKey);
                if (account) {
                    account.checkpoints = action.payload.checkpoint
                        ? [action.payload.checkpoint]
                        : [];
                }
                break;
            }
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
            case COINJOIN.CLIENT_ENABLE_FAILED:
                draft.clients[action.payload.symbol] = {
                    ...CLIENT_STATUS_FALLBACK,
                    status: 'unavailable',
                };
                break;
            case COINJOIN.CLIENT_DISABLE:
                delete draft.clients[action.payload.symbol];
                break;
            case COINJOIN.CLIENT_STATUS:
                updateClientStatus(draft, action.payload);
                break;
            case COINJOIN.CLIENT_PRISON_EVENT:
                updateAccountPrison(draft, action.payload);
                break;
            case COINJOIN.CLIENT_SESSION_PHASE:
                updateSessionPhase(draft, action.payload);
                break;
            case COINJOIN.SESSION_PAUSE:
                pauseSession(draft, action.payload);
                break;
            case COINJOIN.SESSION_AUTOSTOP:
                enableSessionAutostop(draft, action.payload);
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
            case COINJOIN.SESSION_TX_CANDIDATE:
                addTxCandidate(draft, action.payload);
                break;
            case COINJOIN.SESSION_TX_BROADCASTED:
            case COINJOIN.SESSION_TX_FAILED:
                removeTxCandidate(draft, action.payload);
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
