import { type TronResourceType } from '@suite-common/wallet-types';
import { MessagesSchema } from '@trezor/protobuf';

export const tronResourceTypeToCode = (
    resourceType: TronResourceType,
): MessagesSchema.TronResourceCode =>
    resourceType === 'energy'
        ? MessagesSchema.TronResourceCode.ENERGY
        : MessagesSchema.TronResourceCode.BANDWIDTH;
