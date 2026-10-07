import { chainQueryKeys, skipToken, useQuery } from '@suite-common/react-query';
import type {
    ChainAccountBalance,
    ChainAccountRef,
    ChainNetwork,
} from '@trezor/network-module-suite-common-types';

import { getChainAccountBalanceQueryOptions } from './chainQueryOptions';

export type UseChainAccountBalanceParams = {
    /** `undefined` while the account's network is not selected or not migrated. */
    network: ChainNetwork | undefined;
    ref: ChainAccountRef | null;
    enabled: boolean;
    lastKnownBalance?: ChainAccountBalance;
};

// Never fetched: stands in for an account no selected network can read.
const UNCOVERED_QUERY_OPTIONS = {
    queryKey: chainQueryKeys.all('uncovered'),
    queryFn: skipToken,
} as const;

/** Balance of one chain account, shown from the last known value until the first fetch lands. */
export const useChainAccountBalance = (params: UseChainAccountBalanceParams) =>
    useQuery<ChainAccountBalance>(
        params.network && params.ref
            ? {
                  ...getChainAccountBalanceQueryOptions({
                      network: params.network,
                      ref: params.ref,
                      enabled: params.enabled,
                  }),
                  placeholderData: params.lastKnownBalance,
              }
            : UNCOVERED_QUERY_OPTIONS,
    );
