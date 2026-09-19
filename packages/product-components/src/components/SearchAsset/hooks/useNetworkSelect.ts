import { useMemo } from 'react';

import type { NetworkSymbol } from '@trezor/network-module-types';

import type { NetworkParams } from '../../../NetworkParams';
import { useSelector } from '../../../network-display/NetworkDisplayProvider';
import { selectNetworkOptions } from '../../../network-display/networkDisplaySelectors';
import { getNetworkOptions } from '../../../utils/getNetworkOptions';

export type SearchAssetSelectConfig = NetworkParams & {
    selectedNetwork: NetworkSymbol | undefined;
    onChange: (network?: NetworkSymbol) => void;
    includeAllOption?: boolean;
    allLabel?: string;
};

export const useNetworkSelect = (config: SearchAssetSelectConfig) => {
    const { isToken, includeAllOption, allLabel, selectedNetwork } = config;
    const networks = useSelector(state => selectNetworkOptions(state, config.networks));

    const allOptions = useMemo(() => {
        const networkOptions = getNetworkOptions({
            networks,
            iconSize: 20,
            isToken,
        }).map(({ symbol, name, icon }) => ({
            label: name,
            value: symbol,
            icon,
        }));

        return includeAllOption
            ? [
                  { label: allLabel ?? 'All networks', value: undefined, icon: undefined },
                  ...networkOptions,
              ]
            : networkOptions;
    }, [networks, isToken, includeAllOption, allLabel]);

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
