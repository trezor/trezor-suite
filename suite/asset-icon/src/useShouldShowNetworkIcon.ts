import { useServices } from '@suite-common/dependency-injection';
import { selectNetworkIconRegistry } from '@suite-common/networks';

export const useShouldShowNetworkIcon = () => {
    const { networkIconRegistry } = useServices(selectNetworkIconRegistry);

    return (symbol?: string, contractAddress?: string | null) =>
        !!symbol &&
        !!contractAddress &&
        !!networkIconRegistry.getNetworkIcon(symbol)?.supportsTokens;
};
