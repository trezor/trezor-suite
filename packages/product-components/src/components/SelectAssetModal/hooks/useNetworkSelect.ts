import { useMemo } from 'react';

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
    const { networks = [], includeAllOption, allLabel, selectedNetwork } = config ?? {};

    const options = useMemo(() => {
        const networkOptions = networks
            .map(symbol => {
                const network = getNetwork(symbol);

                return network ? { label: network.name, value: network.symbol } : null;
            })
            .filter(isNotNull);

        return includeAllOption
            ? [{ label: allLabel ?? 'All networks', value: undefined }, ...networkOptions]
            : networkOptions;
    }, [networks, includeAllOption, allLabel]);

    const selectedOption = useMemo(
        () => options.find(option => option.value === selectedNetwork),
        [options, selectedNetwork],
    );

    return { options, selectedOption };
};
