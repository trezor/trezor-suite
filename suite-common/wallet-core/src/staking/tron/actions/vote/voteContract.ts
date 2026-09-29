import { type Account, type FormState } from '@suite-common/wallet-types';
import * as tronUtils from '@trezor/network-tron/utils';
import { BigNumber } from '@trezor/utils';

import { type TronFlow } from '../../tronStakingTypes';
import { getTronAvailableVotingPower, getTronVotes } from '../../tronStakingUtils';

export type TronVoteAllocation = {
    address: string;
    count: number;
};

export type TronVoteFlow = Extract<TronFlow, 'stake' | 'vote'>;

export const isTronVoteFlow = (flow: TronFlow): flow is TronVoteFlow =>
    flow === 'stake' || flow === 'vote';

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

type ResolveVoteAllocationsParams = {
    account: Account;
    representativeAddress: string;
    flow: TronVoteFlow;
};

// A Tron vote transaction replaces the account's entire allocation, so every submission has to
// carry the full desired distribution. The vote step of the stake flow assigns only the votes not
// allocated yet (the freshly frozen ones) to the chosen representative and keeps the existing
// allocation untouched; the standalone vote flow deliberately moves the entire voting power, which
// is what changing a representative means.
export const resolveVoteAllocations = ({
    account,
    representativeAddress,
    flow,
}: ResolveVoteAllocationsParams): TronVoteAllocation[] => {
    if (flow === 'vote') {
        return [{ address: representativeAddress, count: getTotalVotes(account) }];
    }

    const currentAllocations = getCurrentVoteAllocations(account);
    const availableVotes = toWholeVotes(getTronAvailableVotingPower(account));

    if (availableVotes <= 0) {
        return currentAllocations;
    }

    const isAlreadyVotedFor = currentAllocations.some(
        ({ address }) => address === representativeAddress,
    );

    if (isAlreadyVotedFor) {
        return currentAllocations.map(allocation =>
            allocation.address === representativeAddress
                ? { ...allocation, count: allocation.count + availableVotes }
                : allocation,
        );
    }

    return [...currentAllocations, { address: representativeAddress, count: availableVotes }];
};

const getAllocatedVotesTotal = (allocations: TronVoteAllocation[]): number =>
    allocations.reduce((total, { count }) => total + count, 0);

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
