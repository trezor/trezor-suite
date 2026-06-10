import { MessagesSchema } from '@trezor/protobuf';

import { type TronResourceType } from './tronStakeTypes';

const tronResourceTypeToCode = (resourceType: TronResourceType): MessagesSchema.TronResourceCode =>
    resourceType === 'energy'
        ? MessagesSchema.TronResourceCode.ENERGY
        : MessagesSchema.TronResourceCode.BANDWIDTH;

interface BuildFreezeBalanceV2ContractParams {
    ownerHex: string;
    balance: number;
    resourceType: TronResourceType;
}

export const buildFreezeBalanceV2Contract = ({
    ownerHex,
    balance,
    resourceType,
}: BuildFreezeBalanceV2ContractParams) =>
    ({
        type: 'FreezeBalanceV2Contract' as const,
        parameter: {
            value: {
                owner_address: ownerHex,
                balance,
                resource: tronResourceTypeToCode(resourceType),
            },
        },
    }) as const;

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
