import { type WalletKitTypes } from '@reown/walletkit';

import { type AnalyticsSharedEvents } from '@suite-common/analytics';
import * as connectPopup from '@suite-common/connect-popup';
import { mock } from '@suite-common/dependency-injection';
import { deviceInitialState } from '@suite-common/device';
import { messageSystemInitialState } from '@suite-common/message-system';
import { asNetworkSymbol } from '@suite-common/networks';
import { mockNetworkModule, mockNetworkModuleRepository } from '@suite-common/networks/mocks';
import { createMockDispatch } from '@suite-common/redux-utils/mocks';
import { type LockDevice } from '@suite-common/suite-types';
import { initialWalletSettingsState, transactionsInitialState } from '@suite-common/wallet-core';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';
import TrezorConnect from '@trezor/connect';
import type {
    WalletConnectAdapter,
    WalletConnectRequestContext,
} from '@trezor/network-module-suite-common-types';

import {
    type WalletConnectRequestThunkDeps,
    type WalletConnectRequestThunkState,
    walletConnectRequestThunk,
} from './walletConnectRequestThunk';
import { type WalletConnectSession } from './walletConnectTypes';

jest.mock('@suite-common/connect-popup', () => ({
    ...jest.requireActual('@suite-common/connect-popup'),
    connectPopupCallThunk: jest.fn((params: unknown) => ({ type: 'connectPopupCall', params })),
    getPopupCallDeferred: jest.fn(),
}));

jest.mock('@trezor/connect', () => ({
    ...jest.requireActual('@trezor/connect'),
    __esModule: true,
    default: { getAccountInfo: jest.fn() },
}));

const ethAccount = mockWalletAccount(
    { symbol: asNetworkSymbol('eth'), descriptor: asAccountDescriptor('0xa') },
    { misc: { nonce: '3' } },
);
const solAccount = mockWalletAccount({
    symbol: asNetworkSymbol('sol'),
    descriptor: asAccountDescriptor('solA'),
});

const session: WalletConnectSession = {
    topic: 'topic',
    namespaces: {},
    peer: { metadata: { name: 'dApp', url: 'https://dapp.example', icons: ['icon.png'] } },
    lastAccount: solAccount,
};

const createState = (mevProtection = true): WalletConnectRequestThunkState => ({
    connectPopup: connectPopup.connectPopupInitialState,
    device: deviceInitialState,
    messageSystem: messageSystemInitialState,
    walletConnect: { sessions: [session], pendingProposal: undefined },
    wallet: {
        accounts: [ethAccount, solAccount],
        settings: { ...initialWalletSettingsState, mevProtection },
        transactions: transactionsInitialState,
    },
});

const createEvent = (method: string, topic = 'topic'): WalletKitTypes.SessionRequest =>
    ({
        id: 1,
        topic,
        params: { request: { method, params: ['param'] }, chainId: 'eip155:1' },
        verifyContext: {
            verified: { origin: 'https://verified.example', validation: 'VALID', verifyUrl: '' },
        },
    }) as WalletKitTypes.SessionRequest;

const createAdapter = (
    handleRequest: WalletConnectAdapter<string>['handleRequest'],
): WalletConnectAdapter<string> => ({
    namespaceId: 'eip155',
    methods: ['personal_sign'],
    events: [],
    getChainIds: () => [],
    getAccountAddress: account => account.descriptor,
    handleRequest,
});

const runRequest = async (
    handleRequest: WalletConnectAdapter<string>['handleRequest'],
    { method = 'personal_sign', topic = 'topic', mevProtection = true } = {},
) => {
    const walletConnectAdapter = createAdapter(handleRequest);
    const getState = () => createState(mevProtection);
    const extra: WalletConnectRequestThunkDeps = {
        services: {
            analytics: mockAnalytics<AnalyticsSharedEvents>(),
            lockDevice: mock<LockDevice>(),
            networks: {
                networkModuleRepository: mockNetworkModuleRepository({
                    getSupportedNetworks: () => [asNetworkSymbol('eth')],
                    get: () => mockNetworkModule({ walletConnectAdapter }),
                }),
            },
        },
    };
    const { actions, dispatch } = createMockDispatch({ getState, extra });

    const result = await dispatch(walletConnectRequestThunk({ event: createEvent(method, topic) }));

    return { actions, result };
};

describe('walletConnectRequestThunk', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('lets the module that owns the method answer', async () => {
        const handleRequest = jest.fn(() => Promise.resolve('0xsignature'));

        const { result } = await runRequest(handleRequest);

        expect(result.payload).toBe('0xsignature');
        expect(handleRequest).toHaveBeenCalledWith(
            expect.objectContaining({
                request: { method: 'personal_sign', params: ['param'], chainId: 'eip155:1' },
                accounts: [
                    expect.objectContaining({ symbol: 'eth', descriptor: '0xa' }),
                    expect.objectContaining({ symbol: 'sol', descriptor: 'solA' }),
                ],
                sessionSymbol: 'sol',
                isMevProtectionEnabled: true,
            }),
        );
    });

    it('turns MEV protection off by the user setting', async () => {
        const handleRequest = jest.fn(() => Promise.resolve(null));

        await runRequest(handleRequest, { mevProtection: false });

        expect(handleRequest).toHaveBeenCalledWith(
            expect.objectContaining({ isMevProtectionEnabled: false }),
        );
    });

    it('asks the user through the popup on behalf of the verified dApp', async () => {
        const popupResult = { success: true as const, payload: { signature: 'signature' } };
        jest.mocked(connectPopup.getPopupCallDeferred).mockReturnValue({
            id: 'popup-call',
            promise: Promise.resolve(popupResult),
            resolve: mock(),
            reject: mock(),
        });

        const { actions, result } = await runRequest(context =>
            context.callDevice('ethereumSignMessage', { path: "m/44'/60'/0'/0/0", message: 'Hi' }),
        );

        expect(actions).toContainEqual({
            type: 'connectPopupCall',
            params: {
                method: 'ethereumSignMessage',
                payload: { path: "m/44'/60'/0'/0/0", message: 'Hi' },
                source: {
                    type: 'walletconnect',
                    origin: 'https://verified.example',
                    manifest: { appName: 'dApp', appIcon: 'icon.png' },
                },
            },
        });
        expect(connectPopup.getPopupCallDeferred).toHaveBeenCalledWith(true);
        expect(result.payload).toEqual(popupResult);
    });

    it('resolves the confirmed nonce of the Ethereum account', async () => {
        (TrezorConnect.getAccountInfo as jest.Mock).mockResolvedValue({
            success: true,
            payload: { misc: { confirmedNonce: '7' } },
        });

        const { result } = await runRequest((context: WalletConnectRequestContext<string>) =>
            context.resolveNonce(context.accounts[0]!),
        );

        expect(TrezorConnect.getAccountInfo).toHaveBeenCalledWith(
            expect.objectContaining({ coin: 'eth', descriptor: '0xa', confirmedNonce: true }),
        );
        expect(result.payload).toBe('7');
    });

    it('does not resolve a nonce for other networks', async () => {
        const { result } = await runRequest(context => context.resolveNonce(context.accounts[1]!));

        expect(result).toEqual(
            expect.objectContaining({
                error: expect.objectContaining({ message: 'Account not found' }),
            }),
        );
        expect(TrezorConnect.getAccountInfo).not.toHaveBeenCalled();
    });

    it.each([
        ['an unsupported method', { method: 'signPsbt' }, 'Unsupported method'],
        ['an unknown session', { topic: 'unknown' }, 'WalletConnect Session not found'],
    ])('rejects %s', async (_description, options, message) => {
        const handleRequest = jest.fn(() => Promise.resolve(null));

        const { result } = await runRequest(handleRequest, options);

        expect(result).toEqual(
            expect.objectContaining({ error: expect.objectContaining({ message }) }),
        );
        expect(handleRequest).not.toHaveBeenCalled();
    });
});
