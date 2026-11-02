import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { useServices } from '@trezor/dependency-injection';
import { type NetworkConfigState, type NetworkSymbol } from '@trezor/network-module-types';

import { selectNetworkOptions } from '../../../network-display/networkDisplaySelectors';
import { injectHasNetworkIcon } from '../../../services/networkServices';
import { getNetworkIcons } from '../../../utils/getNetworkIcons';

export type SearchAssetSelectConfig = {
    networks?: readonly NetworkSymbol[];
    isToken?: boolean;
    selectedNetwork: NetworkSymbol | undefined;
    onChange: (network?: NetworkSymbol) => void;
    includeAllOption?: boolean;
    allLabel?: string;
};

export const useNetworkSelect = (config: SearchAssetSelectConfig) => {
    const { hasNetworkIcon } = useServices(injectHasNetworkIcon);
    const { isToken, includeAllOption, allLabel, selectedNetwork } = config;
    const networks = useSelector((state: NetworkConfigState) =>
        selectNetworkOptions(state, config.networks),
    );

    const allOptions = useMemo(() => {
        const networkOptions = getNetworkIcons(
            { hasNetworkIcon },
            {
                networks,
                iconSize: 20,
                isToken,
            },
        ).map(({ symbol, name, icon }) => ({
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
    }, [hasNetworkIcon, networks, isToken, includeAllOption, allLabel]);

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
