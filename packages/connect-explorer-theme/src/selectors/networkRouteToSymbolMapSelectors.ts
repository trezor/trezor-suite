import type { NetworkSymbol } from '@trezor/network-module-types';

import type { NetworkRoute } from '../networkRoute';

export type NetworkRouteToSymbolMap = Readonly<Record<NetworkRoute, NetworkSymbol>>;

export const selectNetworkRouteToSymbolMap = (state: {
    networkRouteToSymbolMap: NetworkRouteToSymbolMap;
}) => state.networkRouteToSymbolMap;
