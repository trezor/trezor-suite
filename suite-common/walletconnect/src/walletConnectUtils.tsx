import { type NetworkSymbol, getNetwork, networksCollection } from '@suite-common/wallet-config';

import {
    type PendingConnectionProposalNetwork,
    type WalletConnectSession,
} from './walletConnectTypes';

/** caipId marks networks with a WalletConnect adapter, see the adapters of this package. */
export const isWalletConnectSupportedNetwork = (symbol: NetworkSymbol) =>
    getNetwork(symbol).caipId !== undefined;

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
