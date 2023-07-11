import { ROUTER, SUITE } from 'src/actions/suite/constants';
import { accountsActions } from '@suite-common/wallet-core';
import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { AnonymitySet } from '@trezor/blockchain-link';
import { SuiteState } from 'src/reducers/suite/suiteReducer';
import { AcquiredDevice } from 'src/types/suite';
import { DEVICE } from '@trezor/connect';
import { COINJOIN } from 'src/actions/wallet/constants';
import { CoinjoinState } from 'src/reducers/wallet/coinjoinReducer';
import { CoinjoinAccount, CoinjoinSession } from 'src/types/wallet/coinjoin';
import { Account, NetworkSymbol } from 'src/types/wallet';
import { RouterState } from 'src/reducers/suite/routerReducer';

const DEVICE_A = {
    available: true,
    connected: true,
    id: 'device-A-id',
    remember: true,
    state: 'device-A-state',
    type: 'acquired',
} as AcquiredDevice;
const DEVICE_B = { ...DEVICE_A, id: 'device-B-id', state: 'device-B-state' };

const ACCOUNT_A = {
    accountType: 'coinjoin',
    backendType: 'coinjoin',
    deviceState: 'device-A-state',
    history: {},
    key: 'account-A-key',
    status: 'ready',
    symbol: 'btc',
    utxo: [{ address: 'address', amount: '10000', vout: 1 }],
    addresses: {
        anonymitySet: {
            address: 1,
        } as AnonymitySet,
    },
} as Account;
const ACCOUNT_B = { ...ACCOUNT_A, deviceState: 'device-B-state', key: 'account-B-key' };

const COINJOIN_ACCOUNT_A = {
    key: 'account-A-key',
    session: { signedRounds: [] as string[] },
    setup: {
        targetAnonymity: 2,
    },
} as CoinjoinAccount;
const COINJOIN_ACCOUNT_B = {
    ...COINJOIN_ACCOUNT_A,
    key: 'account-B-key',
};

const DEFAULT_STATE = {
    devices: [DEVICE_A, DEVICE_B],
    suite: {
        device: DEVICE_A,
        torStatus: 'Enabled',
    } as SuiteState,
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
                    ...DEFAULT_STATE.wallet.coinjoin.accounts[0],
                    session: {
                        ...DEFAULT_STATE.wallet.coinjoin.accounts[0].session,
                    } as CoinjoinSession,
                },
                {
                    ...DEFAULT_STATE.wallet.coinjoin.accounts[1],
                    session: {
                        ...DEFAULT_STATE.wallet.coinjoin.accounts[1].session,
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
            accountKey: 'account-A-key',
        },
    },
    {
        type: COINJOIN.SESSION_PAUSE,
        payload: {
            accountKey: 'account-B-key',
        },
    },
];

const RESTORE_SESSION_B_ACTIONS = [
    {
        type: COINJOIN.SESSION_STARTING,
        payload: {
            accountKey: 'account-B-key',
            isStarting: true,
        },
    },
    {
        type: COINJOIN.SESSION_RESTORE,
        payload: {
            accountKey: 'account-B-key',
        },
    },
    {
        type: COINJOIN.SESSION_STARTING,
        payload: {
            accountKey: 'account-B-key',
            isStarting: false,
        },
    },
];

export const fixtures = [
    {
        description: 'stopping coinjoin session when remembered device disconnects',
        state: DEFAULT_STATE,
        client: 'btc' as NetworkSymbol,
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
                    accountKey: 'account-A-key',
                },
            },
        ],
    },
    {
        description: 'interrupt all coinjoin sessions when Tor is disabled',
        state: DEFAULT_STATE,
        action: {
            type: SUITE.TOR_STATUS,
            payload: 'Disabled',
        },
        expectedActions: PAUSE_ALL_INTERRUPTED_SESSIONS_ACTIONS,
    },
    {
        description: 'restore all interrupted coinjoin sessions when Tor is enabled',
        state: STATE_WITH_INTERRUPTED_SESSION,
        client: 'btc' as NetworkSymbol,
        connect: {
            success: true,
        },
        action: {
            type: SUITE.TOR_STATUS,
            payload: 'Enabled',
        },
        expectedActions: RESTORE_SESSION_B_ACTIONS,
    },
    {
        description: 'interrupt current coinjoin session when user enters send form',
        state: DEFAULT_STATE,
        action: {
            type: ROUTER.LOCATION_CHANGE,
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
                    accountKey: 'account-B-key',
                },
            },
        ],
    },
    {
        description: 'restore all interrupted coinjoin sessions when user leaves send form',
        state: STATE_WITH_INTERRUPTED_SESSION,
        client: 'btc' as NetworkSymbol,
        connect: [
            {
                success: true,
            },
        ],
        action: {
            type: ROUTER.LOCATION_CHANGE,
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
                    accountKey: 'account-B-key',
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
        client: 'btc' as NetworkSymbol,
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
            type: SUITE.ONLINE_STATUS,
            payload: false,
        },
        expectedActions: PAUSE_ALL_INTERRUPTED_SESSIONS_ACTIONS,
    },
    {
        description: 'restore all interrupted coinjoin sessions when Suite goes online',
        state: STATE_WITH_INTERRUPTED_SESSION,
        client: 'btc' as NetworkSymbol,
        connect: [
            {
                success: true,
            },
        ],
        action: {
            type: SUITE.ONLINE_STATUS,
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
        client: 'btc' as NetworkSymbol,
        connect: [
            {
                success: true,
            },
        ],
        action: {
            type: SUITE.ONLINE_STATUS,
            payload: true,
        },
        expectedActions: [],
    },
];
