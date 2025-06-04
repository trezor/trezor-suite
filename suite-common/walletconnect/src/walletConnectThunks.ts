import { WalletKit, WalletKitTypes } from '@reown/walletkit';
import type { WalletKit as WalletKitClient } from '@reown/walletkit/dist/types/client';
import { Core } from '@walletconnect/core';
import {
    buildApprovedNamespaces,
    buildAuthObject,
    getSdkError,
    populateAuthPayload,
} from '@walletconnect/utils';

import { EventType, analytics } from '@suite-common/analytics';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { getNetwork } from '@suite-common/wallet-config';
import { selectSelectedDevice, selectVisibleSortedDeviceAccounts } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';

import { getAdapterByMethod, getNamespaces, processNamespaces } from './adapters';
import { walletConnectActions } from './walletConnectActions';
import { PROJECT_ID, WALLETCONNECT_METADATA, WALLETCONNECT_MODULE } from './walletConnectConstants';
import { selectPendingProposal } from './walletConnectReducer';
import { PendingConnectionProposalNetwork } from './walletConnectTypes';

let walletKit: WalletKitClient;

export const sessionAuthenticateThunk = createThunk<
    void,
    {
        event: WalletKitTypes.SessionAuthenticate;
    }
>(`${WALLETCONNECT_MODULE}/sessionAuthenticateThunk`, async ({ event }, { getState }) => {
    // Support for Sign-In with Ethereum (SIWE) message, enhanced by ReCaps (ReCap Capabilities)
    try {
        const device = selectSelectedDevice(getState());
        const accounts = selectVisibleSortedDeviceAccounts(getState());
        const supportedNamespaces = getNamespaces(accounts);
        const authPayload = populateAuthPayload({
            authPayload: event.params.authPayload,
            chains: supportedNamespaces.eip155.chains,
            methods: supportedNamespaces.eip155.methods,
        });
        const ethAccount = accounts.find(a => a.symbol === 'eth');
        if (!ethAccount) {
            throw new Error('No ETH account');
        }
        const iss = `eip155:1:${ethAccount.descriptor}`;
        const message = walletKit.formatAuthMessage({
            request: authPayload,
            iss,
        });

        const signature = await TrezorConnect.ethereumSignMessage({
            path: ethAccount.path,
            message,
            device,
            useEmptyPassphrase: device?.useEmptyPassphrase,
        });

        if (signature.success === false) {
            throw new Error('Failed to sign message');
        }

        const auth = buildAuthObject(
            authPayload,
            {
                t: 'eip191',
                s: `0x${signature.payload.signature}`,
            },
            iss,
        );

        await walletKit.approveSessionAuthenticate({
            id: event.id,
            auths: [auth],
        });
    } catch (error) {
        console.error(error);

        await walletKit.rejectSessionAuthenticate({
            id: event.id,
            reason: getSdkError('USER_REJECTED'),
        });
    }
});

export const sessionProposalThunk = createThunk<
    void,
    {
        event: WalletKitTypes.SessionProposal;
    }
>(`${WALLETCONNECT_MODULE}/sessionProposalThunk`, ({ event }, { dispatch, getState }) => {
    // Check supported networks
    const accounts = selectVisibleSortedDeviceAccounts(getState());
    const networks: PendingConnectionProposalNetwork[] = [];
    processNamespaces(accounts, networks, event.params.requiredNamespaces, true);
    processNamespaces(accounts, networks, event.params.optionalNamespaces, false);

    dispatch(
        walletConnectActions.createSessionProposal({
            eventId: event.id,
            params: event.params,
            expired: false,
            networks,
            ...event.verifyContext.verified,
        }),
    );
    analytics.report({
        type: EventType.WalletConnectProposal,
        payload: {
            origin: event.verifyContext.verified.origin,
            validation: event.verifyContext.verified.validation,
            networks: networks.map(network => network.namespaceId),
        },
    });
});

export const sessionRequestThunk = createThunk<
    void,
    {
        event: WalletKitTypes.SessionRequest;
    }
>(`${WALLETCONNECT_MODULE}/sessionRequestThunk`, async ({ event }, { dispatch }) => {
    try {
        const adapter = getAdapterByMethod(event.params.request.method);
        if (!adapter) {
            throw new Error('Unsupported method');
        }

        const result = await dispatch(adapter.requestThunk({ event }));
        if (!result || result.error) {
            throw new Error('Device request failed');
        }

        await walletKit.respondSessionRequest({
            topic: event.topic,
            response: {
                id: event.id,
                jsonrpc: '2.0',
                result: result.payload,
            },
        });
        analytics.report({
            type: EventType.WalletConnectSessionRequest,
            payload: {
                origin: event.verifyContext.verified.origin,
                chainId: event.params.chainId,
                method: event.params.request.method,
            },
        });
    } catch (error) {
        await walletKit.respondSessionRequest({
            topic: event.topic,
            response: {
                id: event.id,
                jsonrpc: '2.0',
                error: {
                    code: 1,
                    message: error.message,
                },
            },
        });
        analytics.report({
            type: EventType.WalletConnectError,
            payload: { error: error.message },
        });
    }
});

// Selected Account was switched in Suite
export const switchSelectedAccountThunk = createThunk<
    void,
    { account: Account; sessionTopic: string }
>(
    `${WALLETCONNECT_MODULE}/switchSelectedAccountThunk`,
    async ({ account, sessionTopic }, { getState }) => {
        const accounts = selectVisibleSortedDeviceAccounts(getState());
        const updatedNamespaces = getNamespaces([account, ...accounts]);
        const network = getNetwork(account.symbol);
        if (!network) {
            return console.warn(`No network found for account symbol ${account.symbol}`);
        }
        const sessions = await walletKit.getActiveSessions();
        const session = sessions[sessionTopic];
        if (!session) {
            return console.warn(`Session with topic ${sessionTopic} not found`);
        }
        await walletKit.updateSession({
            topic: sessionTopic,
            namespaces: updatedNamespaces,
        });
        const namespace = account.networkType === 'solana' ? 'solana' : 'eip155';
        const { chains } = session.namespaces[namespace];
        if (!chains) {
            return console.warn(`No chains found for namespace ${namespace}`);
        }

        for (const chainId of chains) {
            if (network.chainId) {
                await walletKit.emitSessionEvent({
                    topic: sessionTopic,
                    event: {
                        name: 'chainChanged',
                        data: network.chainId,
                    },
                    chainId,
                });
            }
            await walletKit.emitSessionEvent({
                topic: sessionTopic,
                event: {
                    name: 'accountsChanged',
                    data: [...updatedNamespaces[namespace].accounts],
                },
                chainId,
            });
        }
    },
);

export const sessionProposalApproveThunk = createThunk<
    void,
    {
        eventId: number;
        selectedDefaultAccount?: Account | null;
    }
>(
    `${WALLETCONNECT_MODULE}/sessionProposalApproveThunk`,
    async ({ eventId, selectedDefaultAccount }, { dispatch, getState }) => {
        try {
            const pendingProposal = selectPendingProposal(getState());
            if (
                !pendingProposal ||
                pendingProposal.eventId !== eventId ||
                pendingProposal.expired
            ) {
                throw new Error('Proposal not found');
            }

            const accounts = selectVisibleSortedDeviceAccounts(getState());
            const supportedNamespaces = getNamespaces([
                ...(selectedDefaultAccount ? [selectedDefaultAccount] : []),
                ...accounts,
            ]);
            const approvedNamespaces = buildApprovedNamespaces({
                proposal: pendingProposal.params,
                supportedNamespaces,
            });
            // No supported accounts found
            if (
                !Object.values(approvedNamespaces).some(namespace => namespace.accounts.length > 0)
            ) {
                await walletKit.rejectSession({
                    id: eventId,
                    reason: getSdkError('UNSUPPORTED_ACCOUNTS'),
                });

                return;
            }

            const session = await walletKit.approveSession({
                id: eventId,
                namespaces: approvedNamespaces,
            });

            if (selectedDefaultAccount) {
                dispatch(
                    switchSelectedAccountThunk({
                        account: selectedDefaultAccount,
                        sessionTopic: session.topic,
                    }),
                );
                dispatch(
                    walletConnectActions.saveSession({
                        ...session,
                        validation: pendingProposal.validation,
                        lastAccount: selectedDefaultAccount,
                    }),
                );
            } else {
                dispatch(
                    walletConnectActions.saveSession({
                        ...session,
                        validation: pendingProposal.validation,
                    }),
                );
            }
            analytics.report({
                type: EventType.WalletConnectProposalApproved,
                payload: {
                    origin: pendingProposal.origin,
                },
            });
        } catch (error) {
            console.error(error);

            await walletKit.rejectSession({
                id: eventId,
                reason: getSdkError('USER_REJECTED'),
            });
            analytics.report({
                type: EventType.WalletConnectError,
                payload: { error: error.message },
            });
        }
    },
);

export const sessionProposalRejectThunk = createThunk<
    void,
    {
        eventId: number;
    }
>(`${WALLETCONNECT_MODULE}/sessionProposalRejectThunk`, async ({ eventId }) => {
    await walletKit.rejectSession({
        id: eventId,
        reason: getSdkError('USER_REJECTED'),
    });
    /* const pendingProposal = selectPendingProposal(getState());
    analytics.report({
        type: EventType.WalletConnectProposalRejected,
        payload: {
            origin: pendingProposal?.origin,
        },
    });*/
});

export const walletConnectInitThunk = createThunk(
    `${WALLETCONNECT_MODULE}/walletConnectInitThunk`,
    async (_, { dispatch }) => {
        if (walletKit) return;

        const core = new Core({
            projectId: PROJECT_ID,
            telemetryEnabled: false,
        });

        walletKit = await WalletKit.init({
            core,
            metadata: WALLETCONNECT_METADATA,
        });

        walletKit.on('session_proposal', event => {
            dispatch(sessionProposalThunk({ event }));
        });

        walletKit.on('proposal_expire', () => {
            dispatch(walletConnectActions.expireSessionProposal());
        });

        walletKit.on('session_request', event => {
            dispatch(sessionRequestThunk({ event }));
        });

        walletKit.on('session_authenticate', event => {
            dispatch(sessionAuthenticateThunk({ event }));
        });

        walletKit.on('session_delete', event => {
            dispatch(walletConnectActions.removeSession({ topic: event.topic }));
        });

        // Populate active sessions
        const sessions = walletKit.getActiveSessions();
        for (const topic in sessions) {
            dispatch(
                walletConnectActions.saveSession({
                    ...sessions[topic],
                }),
            );
        }
        // Reject stale proposals
        const proposals = walletKit.getPendingSessionProposals();
        for (const proposal of Object.values(proposals)) {
            dispatch(sessionProposalRejectThunk({ eventId: proposal.id }));
        }
        analytics.report({
            type: EventType.WalletConnectInit,
        });
    },
);

export const walletConnectPairThunk = createThunk<void, { uri: string }>(
    `${WALLETCONNECT_MODULE}/walletConnectPairThunk`,
    async ({ uri }, { dispatch }) => {
        try {
            await walletKit.pair({ uri });
            analytics.report({
                type: EventType.WalletConnectPaired,
            });
        } catch (error) {
            console.error('WalletKit.pair:', error);
            // TODO: make this a friendly localized message
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: `WalletConnect pairing failed - ${error.message}`,
                }),
            );

            analytics.report({
                type: EventType.WalletConnectError,
                payload: { error: error.message },
            });
        }
    },
);

export const walletConnectDisconnectThunk = createThunk<void, { topic: string }>(
    `${WALLETCONNECT_MODULE}/walletConnectDisconnectThunk`,
    async ({ topic }, { dispatch }) => {
        await dispatch(walletConnectActions.removeSession({ topic }));
        await walletKit.disconnectSession({ topic, reason: getSdkError('USER_DISCONNECTED') });
    },
);
