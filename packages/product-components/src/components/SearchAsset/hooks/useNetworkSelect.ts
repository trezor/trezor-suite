import { useMemo } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { selectNetworkConfigDeps } from '@suite-common/networks';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { isNotNull } from '@trezor/utils';

export interface SearchAssetSelectConfig {
    networks: NetworkSymbol[];
    selectedNetwork: NetworkSymbol | undefined;
    onChange: (network?: NetworkSymbol) => void;
    includeAllOption?: boolean;
    allLabel?: string;
}

export const useNetworkSelect = (config?: SearchAssetSelectConfig) => {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);

    const { networks = [], includeAllOption, allLabel, selectedNetwork } = config ?? {};

    const allOptions = useMemo(() => {
        const networkOptions = networks
            .map(symbol => {
                const network = getNetwork(networkConfigDeps, symbol);

                return network ? { label: network.name, value: network.symbol } : null;
            })
            .filter(isNotNull);

        return includeAllOption
            ? [{ label: allLabel ?? 'All networks', value: undefined }, ...networkOptions]
            : networkOptions;
    }, [networkConfigDeps, networks, includeAllOption, allLabel]);

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
