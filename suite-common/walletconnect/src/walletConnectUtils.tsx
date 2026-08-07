import { type NetworkConfigDeps, getNetworks } from '@suite-common/wallet-config';

import {
    type PendingConnectionProposalNetwork,
    type WalletConnectSession,
} from './walletConnectTypes';

export const getSessionNetworks = (deps: NetworkConfigDeps, session: WalletConnectSession) => {
    const networks: PendingConnectionProposalNetwork[] = [];

    Object.entries(session.namespaces).forEach(([namespaceId, namespace]) =>
        namespace?.chains?.forEach(chain => {
            const supported = getNetworks(deps).find(network => chain === network.caipId);
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
