import { injectNetworkModuleRepository } from '@suite-common/networks';
import { useServices } from '@trezor/dependency-injection';

export const useNetworkIcon = (symbol: string) => {
    const { networkModuleRepository } = useServices(injectNetworkModuleRepository);
    const networkSymbol = symbol.toLowerCase();

    if (!networkModuleRepository.isSupportedNetwork(networkSymbol)) return undefined;

    const networkModule = networkModuleRepository.get(networkSymbol);

    return {
        symbol: networkSymbol,
        icon: networkModule.icon,
        config: networkModule.getNetworkConfig(networkSymbol),
    };
};
