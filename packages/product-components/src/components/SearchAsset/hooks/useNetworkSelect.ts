import { useMemo } from 'react';

import { type NetworkSymbol } from '@suite-common/icons';

export interface SearchAssetSelectConfig {
    networks: { symbol: NetworkSymbol; name: string }[];
    selectedNetwork: NetworkSymbol | undefined;
    onChange: (network?: NetworkSymbol) => void;
    includeAllOption?: boolean;
    allLabel?: string;
}

const EMPTY_NETWORKS: SearchAssetSelectConfig['networks'] = [];

export const useNetworkSelect = (config?: SearchAssetSelectConfig) => {
    const { networks = EMPTY_NETWORKS, includeAllOption, allLabel, selectedNetwork } = config ?? {};

    const allOptions = useMemo(() => {
        const networkOptions = networks.map(({ symbol, name }) => ({ label: name, value: symbol }));

        return includeAllOption
            ? [{ label: allLabel ?? 'All networks', value: undefined }, ...networkOptions]
            : networkOptions;
    }, [networks, includeAllOption, allLabel]);

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
