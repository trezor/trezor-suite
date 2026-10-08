import { useCallback } from 'react';

import { selectIsQueryChainDataEnabled } from '@suite/flags';
import { injectChainNetworksStore } from '@suite-common/chain-data';
import { useServices } from '@suite-common/dependency-injection';
import { injectGetState } from '@suite-common/redux-utils';
import { type Account } from '@suite-common/wallet-types';
import { type ChainNetwork } from '@trezor/network-module-suite-common-types';

/**
 * The chain network that composes, signs and broadcasts for an account: with the `queryChainData`
 * flag on and the account's network able to send. Coinjoin accounts keep the wallet's own flow.
 * Read when a send starts, so a flow never switches midway.
 */
export const useGetSendChainNetwork = () => {
    // Read when a send starts, never during render, so nothing subscribes to the networks.
    const { getState, chainNetworksStore } = useServices(injectGetState, injectChainNetworksStore);

    return useCallback(
        (account: Account | undefined): ChainNetwork | undefined => {
            if (!account || account.backendType === 'coinjoin') return undefined;
            if (!selectIsQueryChainDataEnabled(getState())) return undefined;

            return chainNetworksStore
                .getSnapshot()
                .find(network => network.symbol === account.symbol && network.send);
        },
        [getState, chainNetworksStore],
    );
};
