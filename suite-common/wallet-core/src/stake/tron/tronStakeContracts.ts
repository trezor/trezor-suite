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
