import { type Getter, useGetter } from '@suite-common/dependency-injection';
import type { ChainNetwork } from '@trezor/network-module-suite-common-types';

/**
 * The networks the user selected, each bound to its chosen backend. Instances keep their identity
 * while selection and backend stay the same, so consumers re-render only when they change.
 */
export type GetSelectedChainNetworks = Getter<[], readonly ChainNetwork[]>;

export type GetSelectedChainNetworksDep = { getSelectedChainNetworks: GetSelectedChainNetworks };

export const injectGetSelectedChainNetworks = (services: any): GetSelectedChainNetworksDep => ({
    getSelectedChainNetworks: services.getSelectedChainNetworks,
});

export const useSelectedChainNetworks = () => useGetter(injectGetSelectedChainNetworks);
