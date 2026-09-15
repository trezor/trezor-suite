import { type ReactNode, useMemo } from 'react';

export interface SearchAssetSelectConfig<TSymbol extends string = string> {
    networks: { symbol: TSymbol; name: string; icon?: ReactNode }[];
    selectedNetwork: TSymbol | undefined;
    onChange: (network?: TSymbol) => void;
    includeAllOption?: boolean;
    allLabel?: string;
}

const EMPTY_NETWORKS: [] = [];

export const useNetworkSelect = <TSymbol extends string>(
    config?: SearchAssetSelectConfig<TSymbol>,
) => {
    const { networks = EMPTY_NETWORKS, includeAllOption, allLabel, selectedNetwork } = config ?? {};

    const allOptions = useMemo(() => {
        const networkOptions = networks.map(({ symbol, name, icon }) => ({
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
