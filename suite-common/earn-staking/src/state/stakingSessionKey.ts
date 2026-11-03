import { z } from 'zod';

import type { StakingOperation, StakingProductId } from '@suite-common/earn-staking-common';
import type { AccountKey } from '@suite-common/wallet-types';

export const stakingSessionKeySchema = z.string().min(1).brand<'StakingSessionKey'>();

export type StakingSessionKey = z.infer<typeof stakingSessionKeySchema>;

export type StakingSessionKeyParams = {
    accountKey: AccountKey;
    productId: StakingProductId;
    operation: StakingOperation;
};

export const getStakingSessionKey = ({
    accountKey,
    productId,
    operation,
}: StakingSessionKeyParams): StakingSessionKey =>
    stakingSessionKeySchema.parse(`${accountKey}:${productId}:${operation}`);
