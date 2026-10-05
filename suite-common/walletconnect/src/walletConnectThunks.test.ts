import { configureStore } from '@reduxjs/toolkit';
import { type WalletKitTypes } from '@reown/walletkit';
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
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import {
    type WalletConnectStateRootState,
    prepareWalletConnectReducer,
} from './walletConnectReducer';
import {
    type WalletConnectInitThunkDeps,
    type WalletConnectInitThunkState,
    sessionProposalApproveThunk,
    walletConnectInitThunk,
} from './walletConnectThunks';

const ETHEREUM = 'eip155:1';
const BITCOIN = 'bip122:000000000019d6689c085ae165831e93';
const STATIC_SESSION_ID = 'address@device:0';

const mockSessions: Record<string, SessionTypes.Struct> = {};
const mockHandlers: { sessionProposal?: (event: WalletKitTypes.SessionProposal) => void } = {};
const mockApproveSession = jest.fn<
    Promise<SessionTypes.Struct>,
    [{ id: number; namespaces: SessionTypes.Namespaces }]
>();
const mockUpdateSession = jest.fn<
    Promise<void>,
    [{ topic: string; namespaces: SessionTypes.Namespaces }]
>();

jest.mock('@walletconnect/core', () => ({ Core: jest.fn() }));
jest.mock('@reown/walletkit', () => ({
    WalletKit: {
        init: () =>
            Promise.resolve({
                on: (name: string, handler: (event: WalletKitTypes.SessionProposal) => void) => {
                    if (name === 'session_proposal') mockHandlers.sessionProposal = handler;
                },
                getActiveSessions: () => mockSessions,
                getPendingSessionProposals: () => ({}),
                approveSession: mockApproveSession,
                rejectSession: jest.fn(),
                updateSession: mockUpdateSession,
                emitSessionEvent: jest.fn(),
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
const device = mockSuiteDevice({ state: { staticSessionId: STATIC_SESSION_ID } });

type State = AccountsRootState &
    WalletSettingsRootState &
    DeviceRootState &
    NetworksRootState &
    WalletConnectStateRootState;

const walletState: State['wallet'] = {
    accounts: [ethereumAccount, bitcoinAccount],
    settings: {
        ...initialWalletSettingsState,
        enabledNetworks: [ethereumAccount.symbol, bitcoinAccount.symbol],
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

const ethereumNamespace = { chains: [ETHEREUM], methods: ['personal_sign'], events: [] };
const bitcoinNamespace = { methods: ['getAccountAddresses'], events: [] };

describe('walletConnect session proposal', () => {
    let store: ReturnType<typeof createStore>;

    const receiveProposal = async (proposal: WalletKitTypes.SessionProposal) => {
        mockHandlers.sessionProposal?.(proposal);
        await waitFor(
            () => store.getState().walletConnect.pendingProposal?.eventId === proposal.id,
        );

        return store.getState().walletConnect.pendingProposal?.networks ?? [];
    };

    beforeAll(async () => {
        store = createStore();
        // The init thunk declares the state of every request handler, the proposal flow reads
        // only the slices of this store.
        await walletConnectInitThunk()(
            store.dispatch,
            store.getState as () => WalletConnectInitThunkState,
            extra,
        );
    });

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
