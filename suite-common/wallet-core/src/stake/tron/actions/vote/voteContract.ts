import { type Account, type FormState } from '@suite-common/wallet-types';
import { tronUtils } from '@trezor/blockchain-link-utils';
import { BigNumber } from '@trezor/utils';

interface TronVoteAllocation {
    addressHex: string;
    count: number;
}

interface BuildVoteWitnessContractParams {
    ownerHex: string;
    votes: TronVoteAllocation[];
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

export const getTotalVotes = (account: Account): number => {
    if (account.networkType !== 'tron') {
        return 0;
    }

    return new BigNumber(account.misc.tronResources?.stakingInfo?.totalVotingPower ?? 0)
        .integerValue(BigNumber.ROUND_FLOOR)
        .toNumber();
};

export const buildVoteContract = (account: Account, representativeAddress: string) => {
    const ownerHex = tronUtils.tronAddressToHex(account.descriptor);
    const voteHex = tronUtils.tronAddressToHex(representativeAddress);

    if (!ownerHex || !voteHex) {
        return null;
    }

    return buildVoteWitnessContract({
        ownerHex,
        votes: [{ addressHex: voteHex, count: getTotalVotes(account) }],
    });
};

export const buildVoteReviewForm = (votes: number): FormState => ({
    outputs: [],
    feePerUnit: '0',
    feeLimit: '',
    options: ['broadcast'],
    tronStaking: { kind: 'vote', votes: String(votes) },
    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
    selectedUtxos: [],
});
