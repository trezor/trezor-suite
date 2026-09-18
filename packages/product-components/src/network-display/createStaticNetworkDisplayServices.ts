import type { NetworkDisplayServices, NetworkOption } from './NetworkDisplayServices';

export type StaticNetworkDisplayServicesDeps = {
    networks: readonly NetworkOption[];
};

export const createStaticNetworkDisplayServices = (
    deps: StaticNetworkDisplayServicesDeps,
): NetworkDisplayServices => {
    const networksBySymbol = new Map(deps.networks.map(network => [network.symbol, network]));

    return {
        getNetworks: symbols => {
            const networks = symbols
                ? symbols.map(
                      symbol =>
                          networksBySymbol.get(symbol) ?? {
                              symbol,
                              name: symbol,
                          },
                  )
                : deps.networks;

            return {
                getSnapshot: () => networks,
                getServerSnapshot: () => networks,
                subscribe: () => () => {},
            };
        },
    };
};
