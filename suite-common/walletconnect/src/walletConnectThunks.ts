import { WalletKit, type WalletKitTypes } from '@reown/walletkit';
import type { WalletKit as WalletKitClient } from '@reown/walletkit/dist/types/client';
import { Core } from '@walletconnect/core';
import {
    buildApprovedNamespaces,
    buildAuthObject,
    getSdkError,
    populateAuthPayload,
} from '@walletconnect/utils';

import { events } from '@suite-common/analytics';
import * as trezorConnectPopupActions from '@suite-common/connect-popup';
import { createThunk } from '@suite-common/redux-utils';
import { isDevEnv } from '@suite-common/suite-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { getNetwork } from '@suite-common/wallet-config';
import { selectAllSuccessfulAccountsToList } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { type CallMethodResponse } from '@trezor/connect';

import {
    getAdapterByMethod,
    getAdapterByNetwork,
    getNamespaces,
    processNamespaces,
} from './adapters';
import { walletConnectActions } from './walletConnectActions';
import { PROJECT_ID, WALLETCONNECT_METADATA, WALLETCONNECT_MODULE } from './walletConnectConstants';
import { selectPendingProposal } from './walletConnectReducer';
import { type PendingConnectionProposalNetwork } from './walletConnectTypes';

let walletKit: WalletKitClient;

export const sessionAuthenticateThunk = createThunk<
    void,
    {
        event: WalletKitTypes.SessionAuthenticate;
    }
>(`${WALLETCONNECT_MODULE}/sessionAuthenticateThunk`, async ({ event }, { getState, dispatch }) => {
    // Support for Sign-In with Ethereum (SIWE) message, enhanced by ReCaps (ReCap Capabilities)
    try {
        const accounts = selectAllSuccessfulAccountsToList(getState());
        const supportedNamespaces = getNamespaces(accounts);
        const eip155Namespace = supportedNamespaces.eip155;
        if (!eip155Namespace) {
            throw new Error('No eip155 namespace found');
        }
        const authPayload = populateAuthPayload({
            authPayload: event.params.authPayload,
            chains: eip155Namespace.chains,
            methods: eip155Namespace.methods,
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

        dispatch(
            trezorConnectPopupActions.connectPopupCallThunk({
                source: {
                    type: 'walletconnect' as const,
                    origin: event.verifyContext.verified.origin,
                    manifest: {
                        appName: event.params.requester.metadata.name,
                        appIcon: event.params.requester.metadata.icons?.[0],
                    },
                },
                method: 'ethereumSignMessage',
                payload: {
                    path: ethAccount.path,
                    message,
                },
            }),
        );
        const response = await trezorConnectPopupActions.getPopupCallDeferred(true).promise;
        if (!response.success) {
            throw new Error('Sign message error');
        }
        const typedPayload = response.payload as CallMethodResponse<'ethereumSignMessage'>;

        const auth = buildAuthObject(
            authPayload,
            {
                t: 'eip191',
                s: `0x${typedPayload.signature}`,
            },
            iss,
        );

        const { session } = await walletKit.approveSessionAuthenticate({
            id: event.id,
            auths: [auth],
        });
        if (session) {
            dispatch(
                walletConnectActions.saveSession({
                    ...session,
                    validation: event.verifyContext.verified.validation,
                }),
            );
        }
    } catch (error) {
        dispatch(
            notificationsActions.addToast({
                type: 'error',
                error: error.message,
            }),
        );
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
>(`${WALLETCONNECT_MODULE}/sessionProposalThunk`, ({ event }, { dispatch, getState, extra }) => {
    // Check supported networks
    const accounts = selectAllSuccessfulAccountsToList(getState());
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
    extra.services.analytics.report({
        type: events.walletConnectProposalEvent.name,
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
>(`${WALLETCONNECT_MODULE}/sessionRequestThunk`, async ({ event }, { dispatch, extra }) => {
    try {
        const adapter = getAdapterByMethod(event.params.request.method);
        if (!adapter) {
            throw new Error('Unsupported method');
        }

        const result = await dispatch(adapter.requestThunk({ event }));
        if (!result || result.error) {
            throw result?.error || new Error('Device request failed');
        }

        await walletKit.respondSessionRequest({
            topic: event.topic,
            response: {
                id: event.id,
                jsonrpc: '2.0',
                result: result.payload,
            },
        });
        extra.services.analytics.report({
            type: events.walletConnectSessionRequestEvent.name,
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
    }
});

// Selected Account was switched in Suite
export const switchSelectedAccountThunk = createThunk<
    void,
    { account: Account; sessionTopic: string }
>(
    `${WALLETCONNECT_MODULE}/switchSelectedAccountThunk`,
    async ({ account, sessionTopic }, { getState }) => {
        const accounts = selectAllSuccessfulAccountsToList(getState());
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
        const approvedNamespaces = buildApprovedNamespaces({
            // @ts-expect-error originally only takes proposal, but this works
            proposal: {
                requiredNamespaces: session.requiredNamespaces,
                optionalNamespaces: session.optionalNamespaces,
            },
            supportedNamespaces: updatedNamespaces,
        });

        await walletKit.updateSession({
            topic: sessionTopic,
            namespaces: approvedNamespaces,
        });
        const adapter = getAdapterByNetwork(account.networkType);
        if (!adapter) {
            return console.warn(`No adapter found for network type ${account.networkType}`);
        }
        const namespace = session.namespaces[adapter.namespaceId];
        const chains = namespace?.chains;
        if (!chains) {
            return console.warn(`No chains found for namespace ${adapter.namespaceId}`);
        }

        const approvedEvents = namespace?.events ?? [];
        const updatedNamespace = updatedNamespaces[adapter.namespaceId];
        for (const chainId of chains) {
            if (network.chainId && approvedEvents.includes('chainChanged')) {
                await walletKit.emitSessionEvent({
                    topic: sessionTopic,
                    event: {
                        name: 'chainChanged',
                        data: network.chainId,
                    },
                    chainId,
                });
            }
            if (updatedNamespace && approvedEvents.includes('accountsChanged')) {
                await walletKit.emitSessionEvent({
                    topic: sessionTopic,
                    event: {
                        name: 'accountsChanged',
                        data: [...updatedNamespace.accounts],
                    },
                    chainId,
                });
            }
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
    async ({ eventId, selectedDefaultAccount }, { dispatch, getState, extra }) => {
        try {
            const pendingProposal = selectPendingProposal(getState());
            if (
                !pendingProposal ||
                pendingProposal.eventId !== eventId ||
                pendingProposal.expired
            ) {
                throw new Error('Proposal not found');
            }

            const accounts = selectAllSuccessfulAccountsToList(getState());
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
            extra.services.analytics.report({
                type: events.walletConnectProposalApprovedEvent.name,
                payload: {
                    origin: pendingProposal.origin,
                },
            });
        } catch {
            await walletKit.rejectSession({
                id: eventId,
                reason: getSdkError('USER_REJECTED'),
            });
        }
    },
);

export const sessionProposalRejectThunk = createThunk<
    void,
    {
        eventId: number;
    }
>(
    `${WALLETCONNECT_MODULE}/sessionProposalRejectThunk`,
    async ({ eventId }, { getState, dispatch, extra }) => {
        await walletKit.rejectSession({
            id: eventId,
            reason: getSdkError('USER_REJECTED'),
        });
        const pendingProposal = selectPendingProposal(getState());
        dispatch(walletConnectActions.clearSessionProposal());
        extra.services.analytics.report({
            type: events.walletConnectProposalRejectedEvent.name,
            payload: {
                origin: pendingProposal?.origin,
            },
        });
    },
);

export const walletConnectInitThunk = createThunk(
    `${WALLETCONNECT_MODULE}/walletConnectInitThunk`,
    async (_, { dispatch, extra }) => {
        if (walletKit) return;

        const core = new Core({
            projectId: PROJECT_ID,
            telemetryEnabled: false,
            logger: isDevEnv ? 'warn' : 'silent',
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
            const session = sessions[topic];
            if (session) {
                dispatch(
                    walletConnectActions.saveSession({
                        ...session,
                    }),
                );
            }
        }
        // Reject stale proposals
        const proposals = walletKit.getPendingSessionProposals();
        for (const proposal of Object.values(proposals)) {
            dispatch(sessionProposalRejectThunk({ eventId: proposal.id }));
        }
        extra.services.analytics.report({
            type: events.walletConnectInitEvent.name,
        });
    },
);

export const walletConnectPairThunk = createThunk<void, { uri: string }>(
    `${WALLETCONNECT_MODULE}/walletConnectPairThunk`,
    async ({ uri }, { dispatch, extra }) => {
        if (!walletKit) {
            // May happen when Suite cold-starts from deeplink
            await dispatch(walletConnectInitThunk());
        }

        try {
            await walletKit.pair({ uri });
            extra.services.analytics.report({
                type: events.walletConnectPairedEvent.name,
            });
        } catch {
            throw new Error('Invalid WalletConnect URI');
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
