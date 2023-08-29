import { SessionPhase } from '@trezor/coinjoin';
import { COINJOIN } from 'src/actions/wallet/constants';
import { initialState } from 'src/reducers/wallet/coinjoinReducer';

const account = {
    key: 'A',
    symbol: 'test',
    targetAnonymity: 20,
    session: {
        maxCoordinatorFeeRate: 0.003,
        maxFeePerKvbyte: 2000,
        maxRounds: 8,
        skipRounds: [4, 5],
        targetAnonymity: 20,
        timeCreated: 1674818299886,
        sessionPhaseQueue: [],
        signedRounds: [],
        paused: true,
        interrupted: false,
        timeEnded: 1674818338720,
    },
};

export const actionFixtures = [
    {
        description: 'updateSessionPhase initial',
        initialState: {
            ...initialState,
            accounts: [account],
        },
        actions: [
            {
                type: COINJOIN.CLIENT_SESSION_PHASE,
                payload: {
                    phase: SessionPhase.RoundSearch,
                    accountKeys: ['A'],
                },
            },
        ],
        result: {
            ...initialState,
            accounts: [
                {
                    ...account,
                    session: {
                        ...account.session,
                        sessionPhaseQueue: [SessionPhase.RoundSearch],
                    },
                },
            ],
        },
    },
    {
        description: 'updateSessionPhase duplicate',
        initialState: {
            ...initialState,
            accounts: [
                {
                    ...account,
                    session: {
                        ...account.session,
                        sessionPhaseQueue: [SessionPhase.RoundSearch],
                    },
                },
            ],
        },
        actions: [
            {
                type: COINJOIN.CLIENT_SESSION_PHASE,
                payload: {
                    phase: SessionPhase.RoundSearch,
                    accountKeys: ['A'],
                },
            },
        ],
        result: {
            ...initialState,
            accounts: [
                {
                    ...account,
                    session: {
                        ...account.session,
                        sessionPhaseQueue: [SessionPhase.RoundSearch],
                    },
                },
            ],
        },
    },
    {
        description: 'updateSessionPhase previous',
        initialState: {
            ...initialState,
            accounts: [
                {
                    ...account,
                    session: {
                        ...account.session,
                        sessionPhaseQueue: [SessionPhase.AwaitingOthersConfirmation],
                    },
                },
            ],
        },
        actions: [
            {
                type: COINJOIN.CLIENT_SESSION_PHASE,
                payload: {
                    phase: SessionPhase.AwaitingConfirmation,
                    accountKeys: ['A'],
                },
            },
        ],
        result: {
            ...initialState,
            accounts: [
                {
                    ...account,
                    session: {
                        ...account.session,
                        sessionPhaseQueue: [SessionPhase.AwaitingOthersConfirmation],
                    },
                },
            ],
        },
    },
    {
        description: 'updateSessionPhase previous from first round',
        initialState: {
            ...initialState,
            accounts: [
                {
                    ...account,
                    session: {
                        ...account.session,
                        sessionPhaseQueue: [SessionPhase.AwaitingOthersConfirmation],
                    },
                },
            ],
        },
        actions: [
            {
                type: COINJOIN.CLIENT_SESSION_PHASE,
                payload: {
                    phase: SessionPhase.RoundSearch,
                    accountKeys: ['A'],
                },
            },
        ],
        result: {
            ...initialState,
            accounts: [
                {
                    ...account,
                    session: {
                        ...account.session,
                        sessionPhaseQueue: [
                            SessionPhase.AwaitingOthersConfirmation,
                            SessionPhase.RoundSearch,
                        ],
                    },
                },
            ],
        },
    },
];

export const selectorFixtures = [
    {
        description: 'missing prison object',
        selector: 'selectRegisteredUtxosByAccountKey' as const,
        selectorArgs: [account.key],
        initialState: {
            ...initialState,
            accounts: [account],
        },
        result: undefined,
    },
    {
        description: 'with one blocked input',
        selector: 'selectRegisteredUtxosByAccountKey' as const,
        selectorArgs: [account.key],
        initialState: {
            ...initialState,
            accounts: [
                {
                    ...account,
                    prison: { A0: { roundId: '00' }, A1: { reason: 'this will not be picked' } },
                },
            ],
        },
        result: { A0: { roundId: '00' } },
    },
    {
        description: 'with two blocked inputs (no session but with tx candidate)',
        selector: 'selectRegisteredUtxosByAccountKey' as const,
        selectorArgs: [account.key],
        initialState: {
            ...initialState,
            accounts: [
                {
                    ...account,
                    prison: {
                        A0: { roundId: '00' },
                        A1: { roundId: '11', reason: 'this will not be picked' },
                        A2: { roundId: '00' },
                    },
                    session: undefined,
                    transactionCandidates: [{ roundId: '00' }],
                },
            ],
        },
        result: { A0: { roundId: '00' }, A2: { roundId: '00' } },
    },
    {
        description: 'with blocked input ignored (no session + no tx candidate)',
        selector: 'selectRegisteredUtxosByAccountKey' as const,
        selectorArgs: [account.key],
        initialState: {
            ...initialState,
            accounts: [{ ...account, prison: { A0: { roundId: '00' } }, session: undefined }],
        },
        result: {},
    },
];
