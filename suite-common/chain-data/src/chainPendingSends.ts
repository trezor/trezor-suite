import {
    CONFIDENTIAL_QUERY_META,
    type QueryClient,
    chainQueryKeys,
    queryOptions,
    skipToken,
} from '@suite-common/react-query';
import type { Transaction } from '@trezor/blockchain-link-types';
import type { ChainNetwork } from '@trezor/network-module-suite-common-types';

/** How long a broadcast transaction is shown before the backend lists it, as the wallet did. */
export const PENDING_SEND_TTL_MS = 15 * 60 * 1000;

export type ChainPendingSend = {
    readonly transaction: Transaction;

    /** The transaction it replaces (RBF), which the history then hides. */
    readonly replacedTxid?: string;

    /** When it was broadcast, in milliseconds. */
    readonly sentAt: number;
};

const NO_PENDING_SENDS: readonly ChainPendingSend[] = [];

/**
 * Broadcast transactions the backend does not list yet. Nothing fetches them: the send puts them
 * into the cache, and the history drops them once listed or expired.
 */
export const getChainPendingSendsQueryOptions = (
    network: Pick<ChainNetwork, 'symbol' | 'backendType'>,
    descriptor: string,
) =>
    queryOptions<readonly ChainPendingSend[]>({
        queryKey: chainQueryKeys.accountPendingSends(
            network.symbol,
            network.backendType,
            descriptor,
        ),
        queryFn: skipToken,
        staleTime: Infinity,
        gcTime: PENDING_SEND_TTL_MS,
        meta: CONFIDENTIAL_QUERY_META,
    });

export type AddChainPendingSendParams = {
    network: Pick<ChainNetwork, 'symbol' | 'backendType'>;
    descriptor: string;
    pendingSend: ChainPendingSend;
};

export const addChainPendingSend = (
    queryClient: QueryClient,
    { network, descriptor, pendingSend }: AddChainPendingSendParams,
) => {
    const options = getChainPendingSendsQueryOptions(network, descriptor);
    // Kept while nothing shows the history too, until the pending send would expire anyway.
    queryClient.setQueryDefaults(options.queryKey, { gcTime: PENDING_SEND_TTL_MS });
    queryClient.setQueryData(options.queryKey, (current = NO_PENDING_SENDS) => [
        pendingSend,
        ...current.filter(send => send.transaction.txid !== pendingSend.transaction.txid),
    ]);
};

/** The pending sends still to show: not listed by the backend yet and not expired. */
export const getVisiblePendingSends = (
    pendingSends: readonly ChainPendingSend[],
    listedTxids: ReadonlySet<string>,
    now: number,
) =>
    pendingSends.filter(
        send => !listedTxids.has(send.transaction.txid) && now - send.sentAt < PENDING_SEND_TTL_MS,
    );
