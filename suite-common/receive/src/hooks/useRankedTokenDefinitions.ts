import { useSelector } from 'react-redux';

import { selectHasBitcoinOnlyFirmware } from '@suite-common/device';
import { desktopQueryKeys, useQuery } from '@suite-common/react-query';
import {
    type RankedTokenStructure,
    fetchRankedTokenDefinitions,
} from '@suite-common/token-definitions';

type UseRankedTokenDefinitionsParams<TData> = {
    /** Only the Receive list downloads the definitions; other callers read what it loaded. */
    isFetchEnabled: boolean;
    select?: (definitions: RankedTokenStructure) => TData;
};

/** The ranked token definitions Receive lists; a Bitcoin-only device lists no tokens. */
export const useRankedTokenDefinitions = <TData = RankedTokenStructure>({
    isFetchEnabled,
    select,
}: UseRankedTokenDefinitionsParams<TData>) => {
    const isBitcoinOnlyFirmware = useSelector(selectHasBitcoinOnlyFirmware);

    return useQuery({
        queryKey: desktopQueryKeys.rankedTokenDefinitions(),
        queryFn: ({ signal }) => fetchRankedTokenDefinitions({ signal }),
        enabled: isFetchEnabled && !isBitcoinOnlyFirmware,
        staleTime: Infinity,
        gcTime: Infinity,
        select,
    });
};
