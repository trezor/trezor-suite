import produce from 'immer';
import { ActiveRound } from '@trezor/coinjoin';
import { STORAGE } from '@suite-actions/constants';
import * as COINJOIN from '@wallet-actions/constants/coinjoinConstants';
import { Account, CoinjoinAccount } from '@suite-common/wallet-types';
import { Action } from '@suite-types';
import { PartialRecord } from '@trezor/type-utils';

type Client = {
    status: any[]; // TODO: Rounds from @trezor/coinjoin
};

type CoinjoinState = {
    accounts: CoinjoinAccount[];
    clients: PartialRecord<Account['symbol'], Client>;
};

const initialState: CoinjoinState = {
    accounts: [],
    clients: {},
};

const createAccount = (
    draft: CoinjoinState,
    { account, targetAnonymity }: Extract<Action, { type: typeof COINJOIN.ACCOUNT_CREATE }>,
) => {
    const exists = draft.accounts.find(a => a.key === account.key);
    if (exists) return;
    draft.accounts.push({
        key: account.key,
        targetAnonymity,
        previousSessions: [],
    });
};

const updateTargetAnonymity = (
    draft: CoinjoinState,
    {
        key,
        targetAnonymity,
    }: Extract<Action, { type: typeof COINJOIN.ACCOUNT_UPDATE_TARGET_ANONYMITY }>,
) => {
    const account = draft.accounts.find(a => a.key === key);
    if (!account) return;
    account.targetAnonymity = targetAnonymity;
};

const createSession = (
    draft: CoinjoinState,
    action: Extract<Action, { type: typeof COINJOIN.ACCOUNT_AUTHORIZE_SUCCESS }>,
) => {
    const account = draft.accounts.find(a => a.key === action.account.key);
    if (!account) return;
    account.session = {
        ...action.params,
        timeCreated: Date.now(),
        // phase: 0,
        deadline: Date.now(),
        registeredUtxos: [],
        signedRounds: [],
    };
};

const updateSession = (draft: CoinjoinState, accountKey: string, round: ActiveRound) => {
    const account = draft.accounts.find(a => a.key === accountKey);
    if (!account || !account.session) return;

    const deadline =
        round.phase !== 0
            ? new Date(Date.now() + 1000 * 60).toString()
            : round.roundParameters.inputRegistrationEnd;

    account.session = {
        ...account.session,
        phase: round.phase,
        deadline,
    };
};

const updateRegisteredUtxos = (
    draft: CoinjoinState,
    accountKey: string,
    registeredUtxos: string[],
) => {
    const account = draft.accounts.find(a => a.key === accountKey);
    if (!account || !account.session) return;

    account.session = {
        ...account.session,
        registeredUtxos,
    };
};

const signSession = (draft: CoinjoinState, accountKey: string, roundId: string) => {
    const account = draft.accounts.find(a => a.key === accountKey);
    if (!account || !account.session) return;
    account.session = {
        ...account.session,
        signedRounds: account.session.signedRounds.concat(roundId),
    };
};

const completeSession = (
    draft: CoinjoinState,
    action: Extract<Action, { type: typeof COINJOIN.SESSION_COMPLETED }>,
) => {
    const account = draft.accounts.find(a => a.key === action.accountKey);
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
    action: Extract<Action, { type: typeof COINJOIN.ACCOUNT_UNREGISTER }>,
) => {
    const account = draft.accounts.find(a => a.key === action.account.key);
    if (!account) return;
    if (account.session) {
        account.previousSessions.push({
            ...account.session,
            timeEnded: Date.now(),
        });
        delete account.session;
    }
};

const saveCheckpoint = (
    draft: CoinjoinState,
    action: Extract<Action, { type: typeof COINJOIN.ACCOUNT_DISCOVERY_PROGRESS }>,
) => {
    const account = draft.accounts.find(a => a.key === action.account.key);
    if (!account) return;
    account.checkpoint = action.progress.checkpoint;
};

const createClient = (
    draft: CoinjoinState,
    action: Extract<Action, { type: typeof COINJOIN.CLIENT_ENABLE_SUCCESS }>,
) => {
    const exists = draft.clients[action.symbol];
    if (exists) return;
    draft.clients[action.symbol] = {
        status: [],
    };
};

export const coinjoinReducer = (
    state: CoinjoinState = initialState,
    action: Action,
): CoinjoinState =>
    produce(state, draft => {
        switch (action.type) {
            case STORAGE.LOAD:
                // Temporary code
                // coinjoin reducer is not stored in DB yet
                // restore accounts with coinjoin accountType
                action.payload.accounts.forEach(account => {
                    if (account.accountType === 'coinjoin') {
                        draft.accounts.push({
                            key: account.key,
                            targetAnonymity: 0,
                            previousSessions: [],
                        });
                    }
                });
                break;
            case COINJOIN.ACCOUNT_CREATE:
                createAccount(draft, action);
                break;
            case COINJOIN.ACCOUNT_UPDATE_TARGET_ANONYMITY:
                updateTargetAnonymity(draft, action);
                break;
            case COINJOIN.ACCOUNT_UPDATE_REGISTERED_UTXOS:
                updateRegisteredUtxos(draft, action.key, action.utxos);
                break;
            case COINJOIN.ACCOUNT_AUTHORIZE_SUCCESS:
                createSession(draft, action);
                break;
            case COINJOIN.ACCOUNT_UNREGISTER:
                stopSession(draft, action);
                break;
            case COINJOIN.ACCOUNT_DISCOVERY_PROGRESS:
                saveCheckpoint(draft, action);
                break;

            case COINJOIN.CLIENT_ENABLE_SUCCESS:
                createClient(draft, action);
                break;

            case COINJOIN.ROUND_PHASE_CHANGED:
                updateSession(draft, action.accountKey, action.round);
                break;

            case COINJOIN.ROUND_TX_SIGNED:
                signSession(draft, action.accountKey, action.roundId);
                break;

            case COINJOIN.SESSION_COMPLETED:
                completeSession(draft, action);
                break;

            // no default
        }
    });
