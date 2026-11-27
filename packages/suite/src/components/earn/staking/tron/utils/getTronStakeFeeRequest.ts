import { type TronStakeFeeRequest, type TronStakeStepId } from '@suite-common/wallet-core';
import { type TronResourceType } from '@suite-common/wallet-types';
import { exhaustive } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import { parseVoteAllocations } from './voteUtils';
import { type TronVoteFormAllocation } from '../hooks/useTronStakeForm';

export const getTronStakeFeeRequest = (
    step: TronStakeStepId,
    amount: string,
    resourceType: TronResourceType,
    voteAllocations: TronVoteFormAllocation[] | undefined,
): TronStakeFeeRequest | undefined => {
    switch (step) {
        case 'freeze':
        case 'unstake': {
            const value = new BigNumber(amount);

            return value.isFinite() && value.gt(0) ? { step, amount, resourceType } : undefined;
        }
        case 'vote': {
            const allocations = parseVoteAllocations(voteAllocations ?? []);

            return allocations.length > 0 ? { step, allocations } : undefined;
        }
        case 'withdraw':
        case 'claim':
            return { step };
        case 'complete':
            return undefined;
        default:
            return exhaustive(step);
    }
};
