import { type Account } from '@suite-common/wallet-types';
import { getAccountIdentity } from '@suite-common/wallet-utils';
import { TrezorBlockchain } from '@trezor/blockchain-core';
import { asCoinSymbol } from '@trezor/connect-common';
import { LidoContractReads, type LidoDeployment } from '@trezor/network-ethereum-suite-common';

import {
    type ClaimableLidoWithdrawalRequest,
    type LidoWithdrawalRequest,
    toClaimableLidoWithdrawalRequests,
    toLidoWithdrawalRequests,
} from './lidoStakingUtils';

type CallLidoContractParams = {
    account: Account;
    to: string;
    data: string;
};

const callLidoContract = async ({ account, to, data }: CallLidoContractParams) => {
    const response = await TrezorBlockchain.evmRpcCall({
        coin: asCoinSymbol(account.symbol),
        identity: getAccountIdentity(account),
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
    account: Account;
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
    account: Account;
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

    const requests = toLidoWithdrawalRequests({ requestIds, statuses });

    return {
        pendingRequests: requests.filter(({ isFinalized }) => !isFinalized),
        finalizedRequests: requests.filter(({ isFinalized }) => isFinalized),
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
