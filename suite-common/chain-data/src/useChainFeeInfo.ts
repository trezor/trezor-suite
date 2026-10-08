import {
    type QueryFunctionContext,
    chainQueryKeys,
    queryOptions,
    skipToken,
    useQuery,
} from '@suite-common/react-query';
import type { ChainNetwork } from '@trezor/network-module-suite-common-types';

// Fees move with every block; a quote older than this is not offered for a new draft.
const FEE_INFO_STALE_TIME_MS = 15_000;

/**
 * The fee levels a network quotes itself. Only networks the wallet keeps no fee state for (runtime
 * networks) quote them; for any other network the query never runs.
 */
export const getChainFeeInfoQueryOptions = (network: ChainNetwork) => {
    const getFeeInfo = network.send?.getFeeInfo;

    return queryOptions({
        queryKey: chainQueryKeys.feeInfo(network.symbol, network.backendType),
        queryFn: getFeeInfo
            ? ({ signal }: QueryFunctionContext) => getFeeInfo({ signal })
            : skipToken,
        staleTime: FEE_INFO_STALE_TIME_MS,
        refetchInterval: FEE_INFO_STALE_TIME_MS,
        refetchIntervalInBackground: false,
    });
};

export type UseChainFeeInfoParams = {
    /** `undefined` while the network is not selected. */
    network: ChainNetwork | undefined;
    enabled: boolean;
};

/** Fee levels quoted by the network, refreshed while they are shown. */
export const useChainFeeInfo = ({ network, enabled }: UseChainFeeInfoParams) =>
    useQuery(
        network && enabled
            ? getChainFeeInfoQueryOptions(network)
            : { queryKey: chainQueryKeys.all('uncovered'), queryFn: skipToken },
    );
