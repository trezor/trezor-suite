import { type TrxStats } from '@suite-common/earn-staking-api';
import {
    type TronVoteAllocation,
    getAllocatedVotesTotal,
    splitVotesEvenly,
} from '@suite-common/wallet-core';

import { formatApyValue } from '../../../utils/earnApyUtils';
import { type TronVoteFormAllocation } from '../hooks/useTronStakeForm';

export const formatApr = (apr: number | undefined) =>
    apr != null ? `${formatApyValue(apr)}%` : formatApyValue(apr);

export const parseVoteCount = (value: string): number | null => {
    const trimmedValue = value.trim();

    return /^\d+$/.test(trimmedValue) ? Number(trimmedValue) : null;
};

export const parseVoteAllocations = (allocations: TronVoteFormAllocation[]): TronVoteAllocation[] =>
    allocations.flatMap(({ address, votes }) => {
        const count = parseVoteCount(votes);

        return address && count !== null ? [{ address, count }] : [];
    });

type GetRemainingVotesParams = {
    totalVotes: number;
    allocations: TronVoteFormAllocation[];
};

export const getRemainingVotes = ({ totalVotes, allocations }: GetRemainingVotesParams): number =>
    totalVotes - getAllocatedVotesTotal(parseVoteAllocations(allocations));

export const getRepresentativeName = (
    address: string,
    representatives: TrxStats | undefined,
): string | undefined =>
    representatives?.find(representative => representative.address === address)?.name;

export const getVotingDelegationAnalyticsValue = (
    allocations: TronVoteAllocation[],
    representatives: TrxStats | undefined,
): string =>
    allocations
        .filter(({ count }) => count > 0)
        .map(({ address }) =>
            getRepresentativeName(address, representatives) === undefined ? 'custom' : address,
        )
        .join(',');

export const getRepresentativeApr = (
    address: string,
    representatives: TrxStats | undefined,
): number | undefined =>
    representatives?.find(representative => representative.address === address)?.apr;

type GetWeightedAprParams = {
    allocations: TronVoteAllocation[];
    representatives: TrxStats | undefined;
};

export const getWeightedApr = ({
    allocations,
    representatives,
}: GetWeightedAprParams): number | undefined => {
    const rewardedAllocations = allocations.flatMap(({ address, count }) => {
        const apr = getRepresentativeApr(address, representatives);

        return apr !== undefined && count > 0 ? [{ apr, count }] : [];
    });
    const rewardedVotes = rewardedAllocations.reduce((total, { count }) => total + count, 0);

    if (rewardedVotes === 0) {
        return undefined;
    }

    return (
        rewardedAllocations.reduce((total, { apr, count }) => total + apr * count, 0) /
        rewardedVotes
    );
};

type ApplyRepresentativeSelectionParams = {
    allocations: TronVoteFormAllocation[];
    shownAddresses: string[];
    selectedAddresses: string[];
    totalVotes: number;
};

export const applyRepresentativeSelection = ({
    allocations,
    shownAddresses,
    selectedAddresses,
    totalVotes,
}: ApplyRepresentativeSelectionParams): TronVoteFormAllocation[] => {
    const removedAddresses = shownAddresses.filter(address => !selectedAddresses.includes(address));
    const keptAllocations = allocations.filter(
        ({ address }) => !removedAddresses.includes(address),
    );
    const addedAddresses = selectedAddresses.filter(
        address => !keptAllocations.some(allocation => allocation.address === address),
    );
    const votesToSplit = Math.max(
        getRemainingVotes({ totalVotes, allocations: keptAllocations }),
        0,
    );
    const addedShares = splitVotesEvenly({ votes: votesToSplit, shares: addedAddresses.length });

    return [
        ...keptAllocations,
        ...addedAddresses.map((address, index) => ({
            address,
            votes: String(addedShares[index] ?? 0),
        })),
    ];
};

type ApplyVoteReassignmentParams = {
    allocations: TronVoteFormAllocation[];
    reassignedAllocations: TronVoteFormAllocation[];
};

export const applyVoteReassignment = ({
    allocations,
    reassignedAllocations,
}: ApplyVoteReassignmentParams): TronVoteFormAllocation[] =>
    allocations.map(
        allocation =>
            reassignedAllocations.find(({ address }) => address === allocation.address) ??
            allocation,
    );
