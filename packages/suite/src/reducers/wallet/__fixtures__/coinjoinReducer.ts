import { COINJOIN } from 'src/actions/wallet/constants';
import { initialState } from 'src/reducers/wallet/coinjoinReducer';
import { SessionPhase } from 'src/types/wallet/coinjoin';

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

export default [
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
