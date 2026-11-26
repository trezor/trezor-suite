import { commonQueryKeys, skipToken, useQuery } from '@suite-common/react-query';
import {
    type LidoWithdrawalQueue,
    type LidoWithdrawals,
    fetchLidoClaims,
    fetchLidoWithdrawalRequests,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getLidoDeployment } from '@trezor/network-ethereum-suite-common';

// The queue finalizes requests with the daily oracle report, so a slow poll is enough.
const REFETCH_INTERVAL_MS = 5 * 60 * 1000;

const EMPTY_QUEUE: LidoWithdrawalQueue = { pendingRequests: [], finalizedRequests: [] };
const EMPTY_CLAIMS: LidoWithdrawals['claimableRequests'] = [];

export type LidoWithdrawalRequests = LidoWithdrawals & {
    // The queue or the claim details have not loaded yet.
    isUnknown: boolean;
    isError: boolean;
    refetch: () => void;
};

/** The queue status and the claim details are read separately so pending NFTs stay visible. */
export const useLidoWithdrawalRequests = (account: Account): LidoWithdrawalRequests => {
    const deployment = getLidoDeployment(account.symbol);
    const { key } = account;

    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- The account key identifies the account and network.
    const queue = useQuery({
        queryKey: commonQueryKeys.lidoWithdrawalRequests(key),
        queryFn:
            deployment === null
                ? skipToken
                : () => fetchLidoWithdrawalRequests({ account, deployment }),
        refetchInterval: REFETCH_INTERVAL_MS,
    });
    const { pendingRequests, finalizedRequests } = queue.data ?? EMPTY_QUEUE;
    const hasFinalizedRequests = finalizedRequests.length > 0;

    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- The account key identifies the account and network.
    const claims = useQuery({
        queryKey: commonQueryKeys.lidoWithdrawalClaims(key, finalizedRequests),
        queryFn:
            deployment === null || !hasFinalizedRequests
                ? skipToken
                : () => fetchLidoClaims({ account, deployment, requests: finalizedRequests }),
        refetchInterval: REFETCH_INTERVAL_MS,
    });

    return {
        pendingRequests,
        claimableRequests: claims.data ?? EMPTY_CLAIMS,
        isUnknown: queue.data === undefined || (hasFinalizedRequests && claims.data === undefined),
        isError: queue.isError || claims.isError,
        refetch: () => {
            if (deployment !== null) void queue.refetch();
            if (hasFinalizedRequests) void claims.refetch();
        },
    };
};
