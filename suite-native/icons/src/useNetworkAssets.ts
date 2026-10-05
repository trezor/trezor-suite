import { injectNetworkIcon, injectNetworkModuleRepository } from '@suite-common/networks';
import { useServices } from '@trezor/dependency-injection';

export const useNetworkAssets = (symbol: string) => {
    const deps = useServices(injectNetworkIcon, injectNetworkModuleRepository);
    const normalizedSymbol = symbol.toLowerCase();
    const networkSymbol = deps.networkModuleRepository.isSupportedNetwork(normalizedSymbol)
        ? normalizedSymbol
        : deps.networkModuleRepository
              .getSupportedNetworks()
              .find(
                  candidate =>
                      deps.networkModuleRepository
                          .get(candidate)
                          .getNetworkConfig(candidate)
                          .displaySymbol.toLowerCase() === normalizedSymbol,
              );

    return networkSymbol ? deps.networkIcon.getIcon(networkSymbol) : undefined;
};
