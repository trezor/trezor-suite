import { type QueryClientDep } from '@suite-common/react-query';
import { type WithServices, createThunk } from '@trezor/redux-utils';

import { evmNetworksQueryOptions } from './evmNetworksQuery';

export type PrefetchEvmNetworksThunkDeps = WithServices<QueryClientDep>;

/** Warms the query cache at startup. Never rejects: a failure leaves the query without networks. */
export const prefetchEvmNetworksThunk = createThunk<
    void,
    void,
    { extra: PrefetchEvmNetworksThunkDeps }
>('@common/evm-networks-api/prefetch', async (_, { extra }) => {
    await extra.services.queryClient.prefetchQuery(evmNetworksQueryOptions);
});
