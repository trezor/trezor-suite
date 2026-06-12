import { MessagesSchema } from '@trezor/protobuf';

import { type TronResourceType } from '../tronStakeTypes';

export const tronResourceTypeToCode = (
    resourceType: TronResourceType,
): MessagesSchema.TronResourceCode =>
    resourceType === 'energy'
        ? MessagesSchema.TronResourceCode.ENERGY
        : MessagesSchema.TronResourceCode.BANDWIDTH;
