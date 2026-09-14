import { type NetworkConfigDeps } from '@suite-common/networks';
import { getNetworksCollection } from '@suite-common/wallet-config';

import {
    type PendingConnectionProposalNetwork,
    type WalletConnectSession,
} from './walletConnectTypes';

export const getSessionNetworks = (
    networkConfigDeps: NetworkConfigDeps,
    session: WalletConnectSession,
) => {
    const networks: PendingConnectionProposalNetwork[] = [];

    Object.entries(session.namespaces).forEach(([namespaceId, namespace]) =>
        namespace?.chains?.forEach(chain => {
            const supported = getNetworksCollection(networkConfigDeps).find(
                nc => chain === nc.caipId,
            );
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
