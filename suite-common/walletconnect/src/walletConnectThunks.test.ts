import { configureStore } from '@reduxjs/toolkit';
import { type IWalletKit, type WalletKitTypes } from '@reown/walletkit';
import { type ProposalTypes, type SessionTypes } from '@walletconnect/types';

import { type DeviceRootState } from '@suite-common/device';
import { type NetworksRootState } from '@suite-common/networks';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { mockActionType } from '@suite-common/redux-utils/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type WalletSettingsRootState,
    initialWalletSettingsState,
} from '@suite-common/wallet-core';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { walletConnectActions } from './walletConnectActions';
import {
    type WalletConnectStateRootState,
    prepareWalletConnectReducer,
    selectSessionByTopic,
} from './walletConnectReducer';
import {
    type WalletConnectInitThunkDeps,
    type WalletConnectInitThunkState,
    sessionProposalApproveThunk,
    switchSelectedAccountThunk,
    walletConnectInitThunk,
} from './walletConnectThunks';

const ETHEREUM = 'eip155:1';
const BITCOIN = 'bip122:000000000019d6689c085ae165831e93';
const LITECOIN = 'bip122:12a765e31ffd4059bada1e25190f6e98';
const SOLANA = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
const SOLANA_LEGACY = 'solana:4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ';
const STATIC_SESSION_ID = 'address@device:0';
const OTHER_STATIC_SESSION_ID = 'address@other:0';

type MockEventHandlers = {
    [TEvent in keyof WalletKitTypes.EventArguments]: (
        event: WalletKitTypes.EventArguments[TEvent],
    ) => void;
};

const mockSessions: Record<string, SessionTypes.Struct> = {};
const mockHandlers: Partial<MockEventHandlers> = {};
const mockApproveSession = jest.fn<
    Promise<SessionTypes.Struct>,
    [{ id: number; namespaces: SessionTypes.Namespaces }]
>();
const mockUpdateSession = jest.fn<
    Promise<void>,
    [{ topic: string; namespaces: SessionTypes.Namespaces }]
>(({ topic, namespaces }) => {
    const session = mockSessions[topic];
    if (session) mockSessions[topic] = { ...session, namespaces };

    return Promise.resolve();
});
const mockEmitSessionEvent = jest.fn<
    ReturnType<IWalletKit['emitSessionEvent']>,
    Parameters<IWalletKit['emitSessionEvent']>
>();
const mockRespondSessionRequest = jest.fn<
    ReturnType<IWalletKit['respondSessionRequest']>,
    Parameters<IWalletKit['respondSessionRequest']>
>();

jest.mock('@walletconnect/core', () => ({ Core: jest.fn() }));
jest.mock('@reown/walletkit', () => ({
    WalletKit: {
        init: () =>
            Promise.resolve({
                on: <TEvent extends keyof MockEventHandlers>(
                    name: TEvent,
                    handler: MockEventHandlers[TEvent],
                ) => {
                    mockHandlers[name] = handler;
                },
                getActiveSessions: () => mockSessions,
                getPendingSessionProposals: () => ({}),
                approveSession: mockApproveSession,
                rejectSession: jest.fn(),
                updateSession: mockUpdateSession,
                emitSessionEvent: mockEmitSessionEvent,
                respondSessionRequest: mockRespondSessionRequest,
            }),
    },
}));

const ethereumAccount = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    deviceState: STATIC_SESSION_ID,
});
const bitcoinAccount = mockWalletAccount({
    symbol: asNetworkSymbol('btc'),
    deviceState: STATIC_SESSION_ID,
    path: "m/84'/0'/0'",
    addresses: {
        used: [],
        unused: [
            {
                address: 'bc1qfirst',
                path: "m/84'/0'/0'/0/0",
                transfers: 0,
                balance: '0',
                sent: '0',
                received: '0',
            },
        ],
        change: [],
    },
});
const litecoinAccount = mockWalletAccount({
    symbol: asNetworkSymbol('ltc'),
    deviceState: STATIC_SESSION_ID,
    descriptor: asAccountDescriptor('litecoinDescriptor'),
    path: "m/84'/2'/0'",
    addresses: {
        used: [],
        unused: [
            {
                address: 'ltc1qfirst',
                path: "m/84'/2'/0'/0/0",
                transfers: 0,
                balance: '0',
                sent: '0',
                received: '0',
            },
        ],
        change: [],
    },
});
const otherWalletBitcoinAccount = mockWalletAccount({
    symbol: asNetworkSymbol('btc'),
    deviceState: OTHER_STATIC_SESSION_ID,
    descriptor: asAccountDescriptor('otherBitcoinDescriptor'),
    path: "m/84'/0'/0'",
    addresses: {
        used: [],
        unused: [
            {
                address: 'bc1qother',
                path: "m/84'/0'/0'/0/0",
                transfers: 0,
                balance: '0',
                sent: '0',
                received: '0',
            },
        ],
        change: [],
    },
});
const solanaAccount = mockWalletAccount({
    symbol: asNetworkSymbol('sol'),
    deviceState: STATIC_SESSION_ID,
    descriptor: asAccountDescriptor('solanaDescriptor'),
});
const otherWalletSolanaAccount = mockWalletAccount({
    symbol: asNetworkSymbol('sol'),
    deviceState: OTHER_STATIC_SESSION_ID,
    descriptor: asAccountDescriptor('otherSolanaDescriptor'),
});
const device = mockSuiteDevice({ state: { staticSessionId: STATIC_SESSION_ID } });

type State = AccountsRootState &
    WalletSettingsRootState &
    DeviceRootState &
    NetworksRootState &
    WalletConnectStateRootState;

const walletState: State['wallet'] = {
    accounts: [
        ethereumAccount,
        bitcoinAccount,
        litecoinAccount,
        otherWalletBitcoinAccount,
        solanaAccount,
        otherWalletSolanaAccount,
    ],
    settings: {
        ...initialWalletSettingsState,
        enabledNetworks: [ethereumAccount.symbol, bitcoinAccount.symbol, litecoinAccount.symbol],
    },
};
const deviceState: State['device'] = { devices: [device], selectedDevice: device };
const networksState: State['networks'] = mockNetworksState(walletState.settings.enabledNetworks);

const extra: WalletConnectInitThunkDeps = {
    services: {
        lockDevice: jest.fn(),
        analytics: {
            init: jest.fn(),
            enable: jest.fn(),
            disable: jest.fn(),
            isEnabled: jest.fn(),
            setUrl: jest.fn(),
            setLoggerEnabled: jest.fn(),
            report: jest.fn(),
        },
    },
};

const createStore = () =>
    configureStore({
        reducer: {
            wallet: (state: State['wallet'] = walletState) => state,
            device: (state: State['device'] = deviceState) => state,
            networks: (state: State['networks'] = networksState) => state,
            walletConnect: prepareWalletConnectReducer({
                actionTypes: { storageLoad: mockActionType('storageLoad') },
            }),
        },
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware({ thunk: { extraArgument: extra }, serializableCheck: false }),
    });

const createProposal = (
    id: number,
    namespaces: Pick<ProposalTypes.Struct, 'requiredNamespaces' | 'optionalNamespaces'>,
): WalletKitTypes.SessionProposal => ({
    id,
    params: {
        id,
        expiryTimestamp: Math.floor(Date.now() / 1000) + 300,
        relays: [{ protocol: 'irn' }],
        proposer: {
            publicKey: '00',
            metadata: { name: 'App', description: '', url: 'https://app.example', icons: [] },
        },
        pairingTopic: 'pairing',
        ...namespaces,
    },
    verifyContext: {
        verified: { origin: 'https://app.example', validation: 'UNKNOWN', verifyUrl: '' },
    },
});

const waitFor = async (condition: () => boolean) => {
    for (let i = 0; i < 50 && !condition(); i++) {
        await new Promise(resolve => setTimeout(resolve, 0));
    }
    expect(condition()).toBe(true);
};

const createSession = (
    topic: string,
    namespaces: SessionTypes.Namespaces,
    optionalNamespaces: ProposalTypes.OptionalNamespaces,
): SessionTypes.Struct => ({
    topic,
    pairingTopic: 'pairing',
    relay: { protocol: 'irn' },
    expiry: Math.floor(Date.now() / 1000) + 300,
    acknowledged: true,
    controller: '00',
    namespaces,
    requiredNamespaces: {},
    optionalNamespaces,
    self: {
        publicKey: '00',
        metadata: { name: 'Wallet', description: '', url: 'https://wallet.example', icons: [] },
    },
    peer: {
        publicKey: '01',
        metadata: { name: 'App', description: '', url: 'https://app.example', icons: [] },
    },
});

const ethereumNamespace = { chains: [ETHEREUM], methods: ['personal_sign'], events: [] };
const bitcoinNamespace = { methods: ['getAccountAddresses'], events: [] };

let store: ReturnType<typeof createStore>;

beforeAll(async () => {
    store = createStore();
    // The init thunk declares the state of every request handler, the flows under test read
    // only the slices of this store.
    await walletConnectInitThunk()(
        store.dispatch,
        store.getState as () => WalletConnectInitThunkState,
        extra,
    );
});

describe('walletConnect session proposal', () => {
    const receiveProposal = async (proposal: WalletKitTypes.SessionProposal) => {
        mockHandlers.session_proposal?.(proposal);
        await waitFor(
            () => store.getState().walletConnect.pendingProposal?.eventId === proposal.id,
        );

        return store.getState().walletConnect.pendingProposal?.networks ?? [];
    };

    it.each([
        { id: 1, field: 'requiredNamespaces' },
        { id: 2, field: 'optionalNamespaces' },
    ] as const)('lists a network requested with a chain key in $field', async ({ id, field }) => {
        const proposal = createProposal(id, {
            requiredNamespaces: {},
            optionalNamespaces: {},
            [field]: { [BITCOIN]: bitcoinNamespace },
        });

        expect(await receiveProposal(proposal)).toEqual([
            expect.objectContaining({
                namespaceId: BITCOIN,
                status: 'active',
                required: field === 'requiredNamespaces',
            }),
        ]);
    });

    it('lists every chain the session is approved and updated with', async () => {
        const proposal = createProposal(3, {
            requiredNamespaces: {},
            optionalNamespaces: { eip155: ethereumNamespace, [BITCOIN]: bitcoinNamespace },
        });
        mockApproveSession.mockImplementation(({ namespaces }) => {
            const session: SessionTypes.Struct = {
                topic: 'session',
                pairingTopic: proposal.params.pairingTopic,
                relay: { protocol: 'irn' },
                expiry: proposal.params.expiryTimestamp,
                acknowledged: true,
                controller: '00',
                namespaces,
                requiredNamespaces: proposal.params.requiredNamespaces,
                optionalNamespaces: proposal.params.optionalNamespaces,
                self: proposal.params.proposer,
                peer: proposal.params.proposer,
            };
            mockSessions[session.topic] = session;

            return Promise.resolve(session);
        });

        const listedChains = (await receiveProposal(proposal))
            .filter(network => network.status === 'active')
            .map(network => network.namespaceId);
        await store.dispatch(
            sessionProposalApproveThunk({
                eventId: proposal.id,
                selectedDefaultAccount: ethereumAccount,
            }),
        );
        await waitFor(() => mockUpdateSession.mock.calls.length > 0);

        const grantedChains = [...mockApproveSession.mock.calls, ...mockUpdateSession.mock.calls]
            .flatMap(([{ namespaces }]) => Object.values(namespaces))
            .flatMap(namespace => namespace.chains ?? []);

        expect(grantedChains).toEqual(expect.arrayContaining([ETHEREUM, BITCOIN]));
        expect(grantedChains.filter(chain => !listedChains.includes(chain))).toEqual([]);
    });
});

describe('walletConnect account switch', () => {
    const switchAccount = async (topic: string) => {
        const session = createSession(
            topic,
            {
                bip122: {
                    chains: [BITCOIN],
                    accounts: [`${BITCOIN}:bc1qprevious`],
                    ...bitcoinNamespace,
                },
            },
            { bip122: { chains: [BITCOIN], ...bitcoinNamespace } },
        );
        mockSessions[topic] = session;
        store.dispatch(walletConnectActions.saveSession(session));

        await store.dispatch(
            switchSelectedAccountThunk({ account: bitcoinAccount, sessionTopic: topic }),
        );

        return {
            requestedNamespaces: mockUpdateSession.mock.lastCall?.[0].namespaces,
            storedNamespaces: selectSessionByTopic(store.getState(), topic)?.namespaces,
        };
    };

    it('stores the namespaces the session is updated with', async () => {
        const { requestedNamespaces, storedNamespaces } = await switchAccount('switch');

        expect(requestedNamespaces?.bip122?.accounts).toEqual([`${BITCOIN}:bc1qfirst`]);
        expect(storedNamespaces).toEqual(requestedNamespaces);
    });

    it('keeps the stored namespaces when WalletKit keeps the previous ones', async () => {
        mockUpdateSession.mockImplementationOnce(() => Promise.resolve());

        const { storedNamespaces } = await switchAccount('switch-unsent');

        expect(storedNamespaces?.bip122?.accounts).toEqual([`${BITCOIN}:bc1qprevious`]);
    });

    const switchAccountWithEvents = async (topic: string, chains: string[], account: Account) => {
        const bitcoinEvents = { methods: ['getAccountAddresses'], events: ['accountsChanged'] };
        const session = createSession(
            topic,
            { bip122: { chains, accounts: [], ...bitcoinEvents } },
            { bip122: { chains, ...bitcoinEvents } },
        );
        mockSessions[topic] = session;
        store.dispatch(walletConnectActions.saveSession(session));

        await store.dispatch(switchSelectedAccountThunk({ account, sessionTopic: topic }));

        return mockEmitSessionEvent.mock.calls
            .filter(call => call[0].topic === topic)
            .map(([{ event }]) => event);
    };

    it('announces only the accounts of the session', async () => {
        expect(await switchAccountWithEvents('events', [BITCOIN], bitcoinAccount)).toEqual([
            { name: 'accountsChanged', data: [`${BITCOIN}:bc1qfirst`] },
        ]);
    });

    it('announces the selected account first', async () => {
        const event = {
            name: 'accountsChanged',
            data: [`${LITECOIN}:ltc1qfirst`, `${BITCOIN}:bc1qfirst`],
        };

        expect(
            await switchAccountWithEvents('events-order', [BITCOIN, LITECOIN], litecoinAccount),
        ).toEqual([event, event]);
    });
});

describe('walletConnect session requests', () => {
    const namespaces: SessionTypes.Namespaces = {
        bip122: { chains: [BITCOIN], accounts: [`${BITCOIN}:bc1qfirst`], ...bitcoinNamespace },
        solana: {
            chains: [SOLANA, SOLANA_LEGACY],
            accounts: [
                `${SOLANA}:${solanaAccount.descriptor}`,
                `${SOLANA_LEGACY}:${solanaAccount.descriptor}`,
            ],
            methods: ['solana_getAccounts'],
            events: [],
        },
    };
    const session = createSession('requests', namespaces, {});
    // A sign-in session is controlled by the peer.
    const peerControlledSession = {
        ...createSession('requests-peer', namespaces, {}),
        controller: '01',
    };

    const request = async (
        topic: string,
        id: number,
        chainId: string,
        method: string,
        params: unknown,
    ) => {
        mockHandlers.session_request?.({
            id,
            topic,
            params: { request: { method, params }, chainId },
            verifyContext: {
                verified: { origin: 'https://app.example', validation: 'UNKNOWN', verifyUrl: '' },
            },
        });
        const findResponse = () =>
            mockRespondSessionRequest.mock.calls.find(([{ response }]) => response.id === id)?.[0]
                .response;
        await waitFor(() => findResponse() !== undefined);

        return findResponse();
    };

    beforeAll(() => {
        store.dispatch(walletConnectActions.saveSession(session));
        store.dispatch(walletConnectActions.saveSession(peerControlledSession));
    });

    it('answers getAccountAddresses for an account of the session', async () => {
        expect(
            await request(session.topic, 11, BITCOIN, 'getAccountAddresses', {
                account: 'bc1qfirst',
            }),
        ).toEqual({
            id: 11,
            jsonrpc: '2.0',
            result: [
                {
                    address: 'bc1qfirst',
                    publicKey: bitcoinAccount.descriptor,
                    path: bitcoinAccount.path,
                },
            ],
        });
    });

    it('answers getAccountAddresses only for accounts of the session', async () => {
        expect(
            await request(session.topic, 12, BITCOIN, 'getAccountAddresses', {
                account: 'bc1qother',
            }),
        ).toEqual({ id: 12, jsonrpc: '2.0', result: undefined });
    });

    it('lists only the Solana accounts of the session', async () => {
        expect(await request(session.topic, 13, SOLANA, 'solana_getAccounts', {})).toEqual({
            id: 13,
            jsonrpc: '2.0',
            result: [{ pubkey: solanaAccount.descriptor }],
        });
    });

    it('answers account reads only in sessions with namespaces set by Suite', async () => {
        const { topic } = peerControlledSession;

        expect(
            await request(topic, 14, BITCOIN, 'getAccountAddresses', { account: 'bc1qfirst' }),
        ).toEqual({ id: 14, jsonrpc: '2.0', result: undefined });
        expect(await request(topic, 15, SOLANA, 'solana_getAccounts', {})).toEqual({
            id: 15,
            jsonrpc: '2.0',
            result: [],
        });
    });
});
