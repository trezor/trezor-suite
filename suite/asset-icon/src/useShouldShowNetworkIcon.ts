import { useServices } from '@suite-common/dependency-injection';
import { injectNetworkIconRegistry } from '@suite-common/networks';

export const useShouldShowNetworkIcon = () => {
    const { networkIconRegistry } = useServices(injectNetworkIconRegistry);

    return (symbol?: string, contractAddress?: string | null) =>
        !!symbol &&
        !!contractAddress &&
        !!networkIconRegistry.getNetworkIcon(symbol)?.supportsTokens;
};
