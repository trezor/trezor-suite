import z from 'zod';

import { tronAddressToBytes } from '@trezor/network-tron/utils';

export const tronStakingListsSchema = z.object({
    unstakingBatches: z.array(z.unknown()),
    votes: z.array(z.unknown()),
});

export const tronUnstakingBatchSchema = z.object({ amount: z.string(), expireTime: z.number() });

export const tronVoteSchema = z.object({
    address: z.string().refine(address => tronAddressToBytes(address) !== null),
    voteCount: z.string(),
});
