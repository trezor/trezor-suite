import { type QueryClient, SILENT_QUERY_META, commonQueryKeys } from '@suite-common/react-query';
import { type Account } from '@suite-common/wallet-types';
import { TrezorBlockchain } from '@trezor/blockchain-core';
import { asCoinSymbol } from '@trezor/connect-common';
import {
    LidoContractReads,
    type LidoDeployment,
    getLidoDeployment,
} from '@trezor/network-ethereum-suite-common';
import { type NetworkSymbol } from '@trezor/network-module-types';
import { BigNumber } from '@trezor/utils';

import {
    type ClaimableLidoWithdrawalRequest,
    type LidoWithdrawalRequest,
    getLidoClaimableAmount,
    toClaimableLidoWithdrawalRequests,
    toLidoWithdrawalRequests,
} from './lidoStakingUtils';

type LidoWithdrawalAccount = {
    descriptor: string;
    symbol: NetworkSymbol;
    deviceState: string;
};

type CallLidoContractParams = {
    account: LidoWithdrawalAccount;
    to: string;
    data: string;
};

const callLidoContract = async ({ account, to, data }: CallLidoContractParams) => {
    const response = await TrezorBlockchain.evmRpcCall({
        coin: asCoinSymbol(account.symbol),
        identity: account.deviceState,
        from: account.descriptor,
        to,
        data,
    });

    if (!response.success) {
        throw new Error(response.error.message);
    }

    return response.payload.data;
};

type FetchLidoClaimsParams = {
    account: LidoWithdrawalAccount;
    deployment: LidoDeployment;
    // Finalized, in ascending order of their ids, as the queue requires.
    requests: readonly LidoWithdrawalRequest[];
};

// The checkpoint hint of each finalized request and, read with it, what the claim pays out.
export const fetchLidoClaims = async ({
    account,
    deployment,
    requests,
}: FetchLidoClaimsParams): Promise<ClaimableLidoWithdrawalRequest[]> => {
    const requestIds = requests.map(({ id }) => BigInt(id));

    const lastCheckpointIndex = LidoContractReads.getLastCheckpointIndex.decode(
        await callLidoContract({
            account,
            to: deployment.withdrawalQueue,
            data: LidoContractReads.getLastCheckpointIndex.encode(),
        }),
    );

    const hints = LidoContractReads.findCheckpointHints.decode(
        await callLidoContract({
            account,
            to: deployment.withdrawalQueue,
            data: LidoContractReads.findCheckpointHints.encode({ requestIds, lastCheckpointIndex }),
        }),
    );

    const claimableAmounts = LidoContractReads.getClaimableEther.decode(
        await callLidoContract({
            account,
            to: deployment.withdrawalQueue,
            data: LidoContractReads.getClaimableEther.encode({ requestIds, hints }),
        }),
    );

    const claimableRequests = toClaimableLidoWithdrawalRequests({
        requests,
        hints,
        claimableAmounts,
    });

    if (claimableRequests === null) {
        throw new Error('The Lido withdrawal queue answered for another number of requests.');
    }

    return claimableRequests;
};

type FetchLidoWithdrawalRequestsParams = {
    account: LidoWithdrawalAccount;
    deployment: LidoDeployment;
};

export type LidoWithdrawalQueue = {
    pendingRequests: readonly LidoWithdrawalRequest[];
    finalizedRequests: readonly LidoWithdrawalRequest[];
};

/** The account's outstanding withdrawal NFTs and their finalization status. */
export const fetchLidoWithdrawalRequests = async ({
    account,
    deployment,
}: FetchLidoWithdrawalRequestsParams): Promise<LidoWithdrawalQueue> => {
    const requestIds = LidoContractReads.getWithdrawalRequests.decode(
        await callLidoContract({
            account,
            to: deployment.withdrawalQueue,
            data: LidoContractReads.getWithdrawalRequests.encode({ owner: account.descriptor }),
        }),
    );

    if (requestIds.length === 0) {
        return { pendingRequests: [], finalizedRequests: [] };
    }

    const statuses = LidoContractReads.getWithdrawalStatus.decode(
        await callLidoContract({
            account,
            to: deployment.withdrawalQueue,
            data: LidoContractReads.getWithdrawalStatus.encode({ requestIds }),
        }),
    );

    const requests = toLidoWithdrawalRequests({
        requestIds,
        statuses,
        owner: account.descriptor,
    });

    return {
        pendingRequests: requests.filter(({ isFinalized }) => !isFinalized),
        finalizedRequests: requests.filter(({ isFinalized }) => isFinalized),
    };
};

// The queue finalizes requests after an oracle report, so a slow refresh is enough.
export const LIDO_WITHDRAWAL_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

type LidoPortfolioAccount = LidoWithdrawalAccount &
    Partial<Pick<Account, 'tokens'>> & {
        key: string;
    };

export const createFetchLidoWithdrawalBalances =
    (queryClient: QueryClient) => async (account: LidoPortfolioAccount) => {
        const deployment = getLidoDeployment(account.symbol);
        const ownedIds = account.tokens?.find(
            token =>
                token.standard === 'ERC721' &&
                token.contract.toLowerCase() === deployment?.withdrawalQueue,
        )?.ids;

        if (deployment === null || !ownedIds?.length) {
            return { unstaking: '0', withdrawable: '0' };
        }

        const owned = new Set(ownedIds);
        const queryKey = commonQueryKeys.lidoWithdrawalRequests(account.key);
        const cachedQueue = queryClient.getQueryData<LidoWithdrawalQueue>(queryKey);
        const knownIds = new Set(
            [
                ...(cachedQueue?.pendingRequests ?? []),
                ...(cachedQueue?.finalizedRequests ?? []),
            ].map(request => request.id),
        );
        const hasNewRequest = ownedIds.some(id => !knownIds.has(id));
        const queue = await queryClient
            .fetchQuery({
                queryKey,
                queryFn: () => fetchLidoWithdrawalRequests({ account, deployment }),
                staleTime: hasNewRequest ? 0 : LIDO_WITHDRAWAL_REFRESH_INTERVAL_MS,
                retry: false,
                meta: SILENT_QUERY_META,
            })
            .catch(() => cachedQueue);

        const pending = (queue?.pendingRequests ?? []).filter(request => owned.has(request.id));
        const finalized = queue?.finalizedRequests ?? [];

        if (finalized.length === 0 || !finalized.some(request => owned.has(request.id))) {
            return {
                unstaking: BigNumber.sum(
                    0,
                    ...pending.map(request => request.amountOfStETH),
                ).toFixed(0),
                withdrawable: '0',
            };
        }

        const claimsKey = commonQueryKeys.lidoWithdrawalClaims(account.key, finalized);
        const claims = await queryClient
            .fetchQuery({
                queryKey: claimsKey,
                queryFn: () => fetchLidoClaims({ account, deployment, requests: finalized }),
                staleTime: LIDO_WITHDRAWAL_REFRESH_INTERVAL_MS,
                retry: false,
                meta: SILENT_QUERY_META,
            })
            .catch(() => queryClient.getQueryData<ClaimableLidoWithdrawalRequest[]>(claimsKey));
        const ownedClaims = (claims ?? []).filter(claim => owned.has(claim.id));
        const pricedIds = new Set(ownedClaims.map(claim => claim.id));
        const unpriced = finalized.filter(
            request => owned.has(request.id) && !pricedIds.has(request.id),
        );

        return {
            // Until the exact payout is available, retain the requested amount as an estimate.
            unstaking: BigNumber.sum(
                0,
                ...pending.map(request => request.amountOfStETH),
                ...unpriced.map(request => request.amountOfStETH),
            ).toFixed(0),
            withdrawable: getLidoClaimableAmount(ownedClaims),
        };
    };

type FetchLidoStakeLimitParams = {
    account: Account;
    deployment: LidoDeployment;
};

/** The ETH Lido takes in stakes right now, in wei: nothing while staking is paused. */
export const fetchLidoStakeLimit = async ({
    account,
    deployment,
}: FetchLidoStakeLimitParams): Promise<string> =>
    LidoContractReads.getCurrentStakeLimit
        .decode(
            await callLidoContract({
                account,
                to: deployment.stETH,
                data: LidoContractReads.getCurrentStakeLimit.encode(),
            }),
        )
        .toString();
