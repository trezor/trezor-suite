import { useMemo } from 'react';

import type { NetworkSymbol } from '@suite-common/wallet-config';

import type { NetworkParams } from '../../../NetworkParams';
import { getNetworkOptions } from '../../../utils/getNetworkOptions';

export type SearchAssetSelectConfig<TSymbol extends NetworkSymbol = NetworkSymbol> =
    NetworkParams<TSymbol> & {
        selectedNetwork: TSymbol | undefined;
        onChange: (network?: TSymbol) => void;
        includeAllOption?: boolean;
        allLabel?: string;
    };

const EMPTY_NETWORKS: [] = [];

export const useNetworkSelect = <TSymbol extends NetworkSymbol>(
    config?: SearchAssetSelectConfig<TSymbol>,
) => {
    const {
        networks = EMPTY_NETWORKS,
        networkNamesMap = null,
        isToken,
        includeAllOption,
        allLabel,
        selectedNetwork,
    } = config ?? {};

    const allOptions = useMemo(() => {
        const networkOptions = getNetworkOptions({
            networks,
            networkNamesMap,
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
    }, [networks, networkNamesMap, isToken, includeAllOption, allLabel]);

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
