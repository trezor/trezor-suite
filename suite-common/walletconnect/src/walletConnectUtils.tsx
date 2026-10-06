import { networksCollection } from '@suite-common/wallet-config';

import {
    type PendingConnectionProposalNetwork,
    type WalletConnectSession,
} from './walletConnectTypes';

export const getSessionNetworks = (session: WalletConnectSession) => {
    const networks: PendingConnectionProposalNetwork[] = [];

    Object.entries(session.namespaces).forEach(([namespaceId, namespace]) =>
        namespace?.chains?.forEach(chain => {
            const supported = networksCollection.find(nc => chain === nc.caipId);
            if (supported) {
                networks.push({
                    namespaceId,
                    symbol: supported?.symbol,
                    name: supported?.name ?? `Unknown (${chain})`,
                    status: 'active',
                    required: false,
                });
            }
        }),
    );

    return networks;
};

/**
 * CAIP-10 ids of the session's accounts in a namespace. Only Suite sets the namespaces of a session
 * it controls; the peer controls a sign-in session and can change its namespaces.
 */
export const getSessionAccountIds = (session: WalletConnectSession, namespaceId: string) =>
    session.controller !== undefined && session.controller === session.self?.publicKey
        ? (session.namespaces[namespaceId]?.accounts ?? [])
        : [];
