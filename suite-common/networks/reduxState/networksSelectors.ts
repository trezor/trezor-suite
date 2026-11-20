import type { Protocol } from '@trezor/network-module-suite-common-types';
import { asNetworkSymbol } from '@trezor/network-module-types';
import { createWeakMapSelector } from '@trezor/redux-utils';
import { typedObjectFromEntries, typedObjectValues } from '@trezor/utils';

import type { NetworkMetadata } from './NetworkMetadata';
import type { NetworksRootState } from './networksReducer';
import type { NetworkSymbol } from '../src/NetworkModules';

const createMemoizedSelector = createWeakMapSelector.withTypes<NetworksRootState>();

export const selectSupportedNetworkSymbols = createMemoizedSelector(
    [state => state.networks],
    (networks): readonly NetworkSymbol[] =>
        networks === null ? [] : typedObjectValues(networks).map(network => network.symbol),
);

export const selectNetworkNamesMap = createMemoizedSelector(
    [state => state.networks],
    (networks): Record<NetworkSymbol, string> | null =>
        networks === null
            ? null
            : typedObjectFromEntries(
                  typedObjectValues(networks).map(({ symbol, name }) => [symbol, name] as const),
              ),
);

export const selectNetworkConfig = (
    state: NetworksRootState,
    symbol: NetworkSymbol,
): NetworkMetadata | null => state.networks?.[symbol] ?? null;

export const selectNetworkCoingeckoId = (
    state: NetworksRootState,
    symbol: NetworkSymbol,
): string | undefined => selectNetworkConfig(state, symbol)?.coingeckoId;

export const selectNetworkConfigs = createMemoizedSelector(
    [state => state.networks],
    (networks): readonly NetworkMetadata[] =>
        networks === null ? [] : typedObjectValues(networks),
);

/**
 * The name of a network's native token.
 *
 * INTENTIONAL: ETH on Arbitrum, Base, Optimism or any other Ethereum L2 is always named just
 * "Ethereum", never "Arbitrum One Ethereum" or "Ethereum on Base". It is the same asset on every
 * network, so the name never mentions the network; screens show the network separately (network
 * icon, network line or network badge). Do not put the network back into this name.
 */
export const selectNativeTokenName = (state: NetworksRootState, symbol: NetworkSymbol) => {
    const network = selectNetworkConfig(state, symbol);
    const nativeTokenNetwork = network?.settlementLayer
        ? selectNetworkConfig(state, network.settlementLayer)
        : network;

    return nativeTokenNetwork?.displaySymbolName || nativeTokenNetwork?.name;
};

const NETWORKS_WITH_NATIVE_TOKEN_NAME_ALIASES: readonly NetworkSymbol[] = [
    'pol',
    'bsc',
    'avax',
].map(asNetworkSymbol);

/** Whether a native asset's name already identifies its network in an asset row. */
export const selectIsNativeTokenNetworkNameRedundant = (
    state: NetworksRootState,
    symbol: NetworkSymbol,
): boolean =>
    selectNativeTokenName(state, symbol) === selectNetworkConfig(state, symbol)?.name ||
    NETWORKS_WITH_NATIVE_TOKEN_NAME_ALIASES.includes(symbol);

export const selectNetworkColor = (state: NetworksRootState, symbol?: NetworkSymbol | null) =>
    symbol ? selectNetworkConfig(state, symbol)?.color : undefined;

export const selectNetworkSymbolForProtocol = (
    state: NetworksRootState,
    protocol: Protocol | undefined,
): NetworkSymbol | null => {
    if (protocol === undefined || state.networks === null) {
        return null;
    }

    return (
        typedObjectValues(state.networks).find(network => network.protocols.includes(protocol))
            ?.symbol ?? null
    );
};
