import { useMemo } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { selectGetNetworkConfigDep } from '@suite-common/networks';
import { type NetworkSymbol } from '@suite-common/wallet-config';

export interface SearchAssetSelectConfig {
    networks: NetworkSymbol[];
    selectedNetwork: NetworkSymbol | undefined;
    onChange: (network?: NetworkSymbol) => void;
    includeAllOption?: boolean;
    allLabel?: string;
}

export const useNetworkSelect = (config?: SearchAssetSelectConfig) => {
    const { getNetworkConfig } = useServices(selectGetNetworkConfigDep);
    const { networks = [], includeAllOption, allLabel, selectedNetwork } = config ?? {};

    const allOptions = useMemo(() => {
        const networkOptions = networks.map(symbol => {
            const network = getNetworkConfig(symbol);

            return { label: network.name, value: symbol };
        });

        return includeAllOption
            ? [{ label: allLabel ?? 'All networks', value: undefined }, ...networkOptions]
            : networkOptions;
    }, [networks, includeAllOption, allLabel, getNetworkConfig]);

    const selectedOption = useMemo(
        () => allOptions.find(option => option.value === selectedNetwork),
        [allOptions, selectedNetwork],
    );

    // The currently selected option is already shown in the select value, so it is
    // filtered out of the menu to avoid showing it twice.
    const options = useMemo(
        () => allOptions.filter(option => option.value !== selectedNetwork),
        [allOptions, selectedNetwork],
    );

    return { options, selectedOption };
};
