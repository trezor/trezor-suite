import { networksCollection } from '@suite-common/wallet-config';

import { PendingConnectionProposalNetwork, WalletConnectSession } from './walletConnectTypes';

export const getSessionNetworks = (session: WalletConnectSession) => {
    const networks: PendingConnectionProposalNetwork[] = [];
    // EVMs
    session.namespaces.eip155?.chains?.forEach(chain => {
        const supported = networksCollection.find(nc => chain === `eip155:${nc.chainId}`);
        if (supported) {
            networks.push({
                namespaceId: 'eip155',
                symbol: supported?.symbol,
                name: supported?.name ?? `Unknown (${chain})`,
                status: 'active',
                required: false,
            });
        }
    });
    // Solana
    if (session.namespaces.solana?.chains?.length) {
        const supported = networksCollection.find(nc => nc.symbol === 'sol');
        if (supported) {
            networks.push({
                namespaceId: 'solana',
                symbol: supported.symbol,
                name: supported.name,
                status: 'active',
                required: false,
            });
        }
    }

    return networks;
};
