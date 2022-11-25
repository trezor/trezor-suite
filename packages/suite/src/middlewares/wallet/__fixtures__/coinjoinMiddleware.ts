import { COINJOIN } from '@wallet-actions/constants';
import { CoinjoinAccount, SessionPhase } from '@wallet-types/coinjoin';

export const sessionPhaseFixture = {
    state: {
        coinjoin: {
            accounts: [
                {
                    key: 'account-A',
                    session: {
                        sessionPhaseQueue: [],
                    },
                } as unknown as CoinjoinAccount,
                {
                    key: 'account-B',
                    session: { sessionPhaseQueue: [] },
                } as unknown as CoinjoinAccount,
            ],
        },
    },
    actions: [
        {
            type: COINJOIN.CLIENT_SESSION_PHASE,
            payload: {
                phase: SessionPhase.RoundSearch,
                accountKeys: ['account-A', 'account-B'],
            },
        },
        {
            type: COINJOIN.CLIENT_SESSION_PHASE,
            payload: {
                phase: SessionPhase.CoinSelection,
                accountKeys: ['account-A', 'account-B'],
            },
        },
        {
            type: COINJOIN.CLIENT_SESSION_PHASE,
            payload: {
                phase: SessionPhase.RoundPairing,
                accountKeys: ['account-A', 'account-B'],
            },
        },
    ],
    immediateResult: [
        {
            type: COINJOIN.CLIENT_SESSION_PHASE,
            payload: {
                phase: SessionPhase.RoundSearch,
                accountKeys: ['account-A', 'account-B'],
            },
        },
        {
            type: COINJOIN.CLIENT_SESSION_PHASE,
            payload: {
                phase: SessionPhase.CoinSelection,
                accountKeys: ['account-A', 'account-B'],
            },
        },
        {
            type: COINJOIN.CLIENT_SESSION_PHASE,
            payload: {
                phase: SessionPhase.RoundPairing,
                accountKeys: ['account-A', 'account-B'],
            },
        },
    ],
    firstShift: [
        {
            type: COINJOIN.CLIENT_SESSION_PHASE,
            payload: {
                phase: SessionPhase.RoundSearch,
                accountKeys: ['account-A', 'account-B'],
            },
        },
        {
            type: COINJOIN.CLIENT_SESSION_PHASE,
            payload: {
                phase: SessionPhase.CoinSelection,
                accountKeys: ['account-A', 'account-B'],
            },
        },
        {
            type: COINJOIN.CLIENT_SESSION_PHASE,
            payload: {
                phase: SessionPhase.RoundPairing,
                accountKeys: ['account-A', 'account-B'],
            },
        },
        {
            type: COINJOIN.CLIENT_SESSION_PHASE_SHIFT,
            payload: {
                accountKeys: ['account-A', 'account-B'],
            },
        },
    ],
    secondShift: [
        {
            type: COINJOIN.CLIENT_SESSION_PHASE,
            payload: {
                phase: SessionPhase.RoundSearch,
                accountKeys: ['account-A', 'account-B'],
            },
        },
        {
            type: COINJOIN.CLIENT_SESSION_PHASE,
            payload: {
                phase: SessionPhase.CoinSelection,
                accountKeys: ['account-A', 'account-B'],
            },
        },
        {
            type: COINJOIN.CLIENT_SESSION_PHASE,
            payload: {
                phase: SessionPhase.RoundPairing,
                accountKeys: ['account-A', 'account-B'],
            },
        },
        {
            type: COINJOIN.CLIENT_SESSION_PHASE_SHIFT,
            payload: {
                accountKeys: ['account-A', 'account-B'],
            },
        },
        {
            type: COINJOIN.CLIENT_SESSION_PHASE_SHIFT,
            payload: {
                accountKeys: ['account-A', 'account-B'],
            },
        },
    ],
};
