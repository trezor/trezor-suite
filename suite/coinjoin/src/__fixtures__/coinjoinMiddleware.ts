import { type RouterState, routerLocationChange } from '@suite/router';
import { TorStatus, torActions } from '@suite/tor';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { accountsActions } from '@suite-common/wallet-core';
import { type Account, type SelectedAccountLoaded } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { type AnonymitySet } from '@trezor/blockchain-link';
import { DEVICE, type StaticSessionId } from '@trezor/connect';

import * as COINJOIN from '../coinjoinConstants';
import { type CoinjoinAccount, type CoinjoinSession, type CoinjoinState } from '../coinjoinTypes';

type FixtureDevice = {
    available: boolean;
    connected: boolean;
    id: string;
    remember: boolean;
    state: {
        staticSessionId: string;
    };
    type: string;
};

type FixtureState = Partial<{
    device: {
        devices: FixtureDevice[];
        selectedDevice: FixtureDevice;
    };
    router: RouterState;
    suite: {
        online: boolean;
    };
    tor: {
        torStatus: TorStatus;
        torBootstrap: null;
    };
    wallet: {
        accounts: Account[];
        coinjoin: CoinjoinState;
        selectedAccount: SelectedAccountLoaded;
    };
}>;

type FixtureAction = {
    type: string;
    payload?: unknown;
};

/** Opaque mock responses passed directly to setTrezorConnectFixtures. */
type ConnectFixtures = unknown;

type Fixture = {
    description: string;
    state: FixtureState;
    action: FixtureAction;
    expectedActions: FixtureAction[];
    client?: 'btc';
    connect?: ConnectFixtures;
};

const btcSymbol = asNetworkSymbol('btc');

const DEVICE_A = {
    available: true,
    connected: true,
    id: 'device-A-id',
    remember: true,
    state: { staticSessionId: '1stTestnet@device_A_id:0' },
    type: 'acquired',
};
const DEVICE_B = {
    ...DEVICE_A,
    id: 'device-B-id',
    state: { staticSessionId: '1stTestnet@device_B_id:0' },
};

const ACCOUNT_A_KEY = mockAccountKey({
    descriptor: 'accountAKey',
    symbol: btcSymbol,
    deviceStaticSessionId: '1stTestnet@device_A_id:0',
});
const ACCOUNT_B_KEY = mockAccountKey({
    descriptor: 'accountBKey',
    symbol: btcSymbol,
    deviceStaticSessionId: '1stTestnet@device_B_id:0',
});

const ACCOUNT_A = {
    accountType: 'coinjoin',
    backendType: 'coinjoin',
    deviceState: '1stTestnet@device_A_id:0' as StaticSessionId,
    history: {},
    key: ACCOUNT_A_KEY,
    status: 'ready',
    symbol: 'btc',
    utxo: [{ address: 'address', amount: '10000', vout: 1 }],
    addresses: {
        anonymitySet: {
            address: 1,
        } as AnonymitySet,
    },
} as Account;
const ACCOUNT_B = {
    ...ACCOUNT_A,
    deviceState: '1stTestnet@device_B_id:0' as StaticSessionId,
    key: ACCOUNT_B_KEY,
};

const COINJOIN_ACCOUNT_A = {
    key: ACCOUNT_A_KEY,
    session: { signedRounds: [] as string[] },
    setup: {
        targetAnonymity: 2,
    },
} as CoinjoinAccount;
const COINJOIN_ACCOUNT_B = {
    ...COINJOIN_ACCOUNT_A,
    key: ACCOUNT_B_KEY,
};

const DEFAULT_STATE = {
    device: {
        devices: [DEVICE_A, DEVICE_B],
        selectedDevice: DEVICE_A,
    },
    suite: { online: true },
    tor: {
        torStatus: TorStatus.Enabled,
        torBootstrap: null,
    },
    wallet: {
        accounts: [ACCOUNT_A, ACCOUNT_B],
        coinjoin: {
            accounts: [COINJOIN_ACCOUNT_A, COINJOIN_ACCOUNT_B],
        } as CoinjoinState,
        selectedAccount: {
            account: ACCOUNT_B,
        } as SelectedAccountLoaded,
    },
};
const STATE_WITH_INTERRUPTED_SESSION = {
    ...DEFAULT_STATE,
    wallet: {
        ...DEFAULT_STATE.wallet,
        coinjoin: {
            ...DEFAULT_STATE.wallet.coinjoin,
            accounts: [
                {
                    ...COINJOIN_ACCOUNT_A,
                    session: {
                        ...COINJOIN_ACCOUNT_A.session,
                    } as CoinjoinSession,
                },
                {
                    ...COINJOIN_ACCOUNT_B,
                    session: {
                        ...COINJOIN_ACCOUNT_B.session,
                        paused: true,
                    } as CoinjoinSession,
                },
            ],
        },
    },
};

const PAUSE_ALL_INTERRUPTED_SESSIONS_ACTIONS = [
    {
        type: COINJOIN.SESSION_PAUSE,
        payload: {
            accountKey: ACCOUNT_A_KEY,
        },
    },
    {
        type: COINJOIN.SESSION_PAUSE,
        payload: {
            accountKey: ACCOUNT_B_KEY,
        },
    },
];

const RESTORE_SESSION_B_ACTIONS = [
    {
        type: COINJOIN.SESSION_STARTING,
        payload: {
            accountKey: ACCOUNT_B_KEY,
            isStarting: true,
        },
    },
    {
        type: COINJOIN.SESSION_RESTORE,
        payload: {
            accountKey: ACCOUNT_B_KEY,
        },
    },
    {
        type: COINJOIN.SESSION_STARTING,
        payload: {
            accountKey: ACCOUNT_B_KEY,
            isStarting: false,
        },
    },
];

export const fixtures: Fixture[] = [
    {
        description: 'stopping coinjoin session when remembered device disconnects',
        state: DEFAULT_STATE,
        client: 'btc' as const,
        action: {
            type: DEVICE.DISCONNECT,
            payload: {
                id: 'device-A-id',
            },
        },
        expectedActions: [
            {
                type: COINJOIN.ACCOUNT_UNREGISTER,
                payload: {
                    accountKey: ACCOUNT_A_KEY,
                },
            },
        ],
    },
    {
        description: 'interrupt all coinjoin sessions when Tor is disabled',
        state: DEFAULT_STATE,
        action: torActions.setTorStatus(TorStatus.Disabled),
        expectedActions: PAUSE_ALL_INTERRUPTED_SESSIONS_ACTIONS,
    },
    {
        description: 'restore all interrupted coinjoin sessions when Tor is enabled',
        state: STATE_WITH_INTERRUPTED_SESSION,
        client: 'btc' as const,
        connect: {
            success: true,
        },
        action: torActions.setTorStatus(TorStatus.Enabled),
        expectedActions: RESTORE_SESSION_B_ACTIONS,
    },
    {
        description: 'interrupt current coinjoin session when user enters send form',
        state: DEFAULT_STATE,
        action: {
            type: routerLocationChange.type,
            payload: {
                route: {
                    name: 'wallet-send',
                },
            },
        },
        expectedActions: [
            {
                type: COINJOIN.SESSION_PAUSE,
                payload: {
                    accountKey: ACCOUNT_B_KEY,
                },
            },
        ],
    },
    {
        description: 'restore all interrupted coinjoin sessions when user leaves send form',
        state: STATE_WITH_INTERRUPTED_SESSION,
        client: 'btc' as const,
        connect: [
            {
                success: true,
            },
        ],
        action: {
            type: routerLocationChange.type,
            payload: {
                route: {
                    name: 'settings-index',
                },
                settingsBackRoute: {
                    name: 'wallet-send',
                },
            },
        },
        expectedActions: RESTORE_SESSION_B_ACTIONS,
    },
    {
        description: 'interrupt related coinjoin session when an account goes out of sync',
        state: DEFAULT_STATE,
        action: {
            type: accountsActions.endCoinjoinAccountSync.type,
            payload: { accountKey: ACCOUNT_B.key, status: 'out-of-sync' },
        },
        expectedActions: [
            {
                type: COINJOIN.SESSION_PAUSE,
                payload: {
                    accountKey: ACCOUNT_B_KEY,
                },
            },
        ],
    },
    {
        description:
            'do not interrupt related coinjoin session when an account goes out of sync during critical phase',
        state: {
            ...DEFAULT_STATE,
            wallet: {
                ...DEFAULT_STATE.wallet,
                coinjoin: {
                    ...DEFAULT_STATE.wallet.coinjoin,
                    accounts: [
                        {
                            ...COINJOIN_ACCOUNT_B,
                            session: {
                                ...COINJOIN_ACCOUNT_B.session,
                                roundPhase: 1,
                            } as CoinjoinSession,
                        },
                    ],
                },
            },
        },
        action: {
            type: accountsActions.endCoinjoinAccountSync.type,
            payload: { accountKey: ACCOUNT_B.key, status: 'out-of-sync' },
        },
        expectedActions: [],
    },
    {
        description: 'restore related coinjoin session when an account syncs',
        state: STATE_WITH_INTERRUPTED_SESSION,
        client: 'btc' as const,
        connect: [
            {
                success: true,
            },
        ],
        action: {
            type: accountsActions.endCoinjoinAccountSync.type,
            payload: { accountKey: ACCOUNT_B.key, status: 'ready' },
        },
        expectedActions: RESTORE_SESSION_B_ACTIONS,
    },
    {
        description: 'interrupt all coinjoin sessions when Suite goes offline',
        state: DEFAULT_STATE,
        action: {
            type: '@suite/online-status',
            payload: false,
        },
        expectedActions: PAUSE_ALL_INTERRUPTED_SESSIONS_ACTIONS,
    },
    {
        description: 'restore all interrupted coinjoin sessions when Suite goes online',
        state: STATE_WITH_INTERRUPTED_SESSION,
        client: 'btc' as const,
        connect: [
            {
                success: true,
            },
        ],
        action: {
            type: '@suite/online-status',
            payload: true,
        },
        expectedActions: RESTORE_SESSION_B_ACTIONS,
    },
    {
        description: 'do not restore session when in send form',
        state: {
            ...STATE_WITH_INTERRUPTED_SESSION,
            router: { route: { name: 'wallet-send' } } as RouterState,
        },
        client: 'btc' as const,
        connect: [
            {
                success: true,
            },
        ],
        action: {
            type: '@suite/online-status',
            payload: true,
        },
        expectedActions: [],
    },
];
