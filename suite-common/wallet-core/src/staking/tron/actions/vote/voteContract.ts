import { type Account, type FormState } from '@suite-common/wallet-types';
import * as tronUtils from '@trezor/network-tron/utils';
import { BigNumber } from '@trezor/utils';

import { getTronVotes } from '../../tronStakingUtils';

export type TronVoteAllocation = {
    address: string;
    count: number;
};

interface TronHexVoteAllocation {
    addressHex: string;
    count: number;
}

interface BuildVoteWitnessContractParams {
    ownerHex: string;
    votes: TronHexVoteAllocation[];
}

export const buildVoteWitnessContract = ({ ownerHex, votes }: BuildVoteWitnessContractParams) =>
    ({
        type: 'VoteWitnessContract' as const,
        parameter: {
            value: {
                owner_address: ownerHex,
                votes: votes.map(({ addressHex, count }) => ({ address: addressHex, count })),
            },
        },
    }) as const;

export type TronVoteContract = ReturnType<typeof buildVoteWitnessContract>;

const toWholeVotes = (votingPower: string): number =>
    new BigNumber(votingPower).integerValue(BigNumber.ROUND_FLOOR).toNumber();

export const getTotalVotes = (account: Account): number => {
    if (account.networkType !== 'tron') {
        return 0;
    }

    return toWholeVotes(account.misc.tronResources?.stakingInfo?.totalVotingPower ?? '0');
};

export const getCurrentVoteAllocations = (account: Account): TronVoteAllocation[] =>
    getTronVotes(account)
        .map(({ address, voteCount }) => ({ address, count: toWholeVotes(voteCount) }))
        .filter(({ count }) => count > 0);

export const getAllocatedVotesTotal = (allocations: TronVoteAllocation[]): number =>
    allocations.reduce((total, { count }) => total + count, 0);

type SplitVotesEvenlyParams = {
    votes: number;
    shares: number;
};

export const splitVotesEvenly = ({ votes, shares }: SplitVotesEvenlyParams): number[] => {
    if (shares <= 0) {
        return [];
    }

    const baseShare = Math.floor(votes / shares);
    const remainder = votes - baseShare * shares;

    return Array.from({ length: shares }, (_, index) =>
        index < remainder ? baseShare + 1 : baseShare,
    );
};

export const buildVoteContract = (account: Account, allocations: TronVoteAllocation[]) => {
    const ownerHex = tronUtils.tronAddressToHex(account.descriptor);

    if (!ownerHex) {
        return null;
    }

    const positiveAllocations = allocations.filter(({ count }) => count > 0);

    if (positiveAllocations.length === 0) {
        return null;
    }

    const votes: TronHexVoteAllocation[] = [];

    for (const { address, count } of positiveAllocations) {
        const addressHex = tronUtils.tronAddressToHex(address);

        if (!addressHex) {
            return null;
        }

        votes.push({ addressHex, count });
    }

    return buildVoteWitnessContract({ ownerHex, votes });
};

export const buildVoteReviewForm = (allocations: TronVoteAllocation[]): FormState => ({
    outputs: [],
    feePerUnit: '0',
    feeLimit: '',
    options: ['broadcast'],
    tronStaking: {
        kind: 'vote',
        votes: String(getAllocatedVotesTotal(allocations)),
        allocations: allocations.map(({ address, count }) => ({
            address,
            votes: String(count),
        })),
    },
    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
    selectedUtxos: [],
});
