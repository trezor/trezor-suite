import { type NetworkSymbol, getNetwork, networksCollection } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';

import {
    type PendingConnectionProposalNetwork,
    type WalletConnectSession,
} from './walletConnectTypes';

/** caipId marks networks with a WalletConnect adapter, see the adapters of this package. */
export const isWalletConnectSupportedNetwork = (symbol: NetworkSymbol) =>
    getNetwork(symbol).caipId !== undefined;

/**
 * Coinjoin accounts stay out, as they do in the Connect popup account picker: the bitcoin adapter
 * spends without the coinjoin coin selection.
 */
export const isWalletConnectSupportedAccount = (account: Account): boolean =>
    account.backendType !== 'coinjoin';

export const getSessionNetworks = (session: WalletConnectSession) => {
    const networks: PendingConnectionProposalNetwork[] = [];

    Object.entries(session.namespaces).forEach(([namespaceId, namespace]) =>
        namespace?.chains?.forEach(chain => {
            // The ethereum adapter builds eip155 chains from chainId, also for networks without
            // a caipId, such as Ethereum Classic and the testnets.
            const supported = networksCollection.find(nc =>
                nc.networkType === 'ethereum'
                    ? chain === `eip155:${nc.chainId}`
                    : chain === nc.caipId,
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
