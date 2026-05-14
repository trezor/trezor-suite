import { desktopMutationKeys, useMutation } from '@suite-common/react-query';

import { type ActionDto, type ActionRequestDto } from '../api/types';
import { enterYield } from '../services';
import { verifyEnterTransactions } from '../verification/enter';
import { type VerificationStatus } from '../verification/shared';

type EnterYieldOpportunityVariables = Pick<ActionRequestDto, 'yieldId' | 'address'> & {
    amount: string;
    decimals: number;
};

type EnterYieldOpportunityResult = {
    response: ActionDto;
    verification: VerificationStatus;
};

/**
 * Generate the transactions needed to enter a yield position
 */
export function useEnterYieldOpportunity() {
    return useMutation<EnterYieldOpportunityResult, Error, EnterYieldOpportunityVariables>({
        mutationKey: desktopMutationKeys.enterYieldOpportunity,
        async mutationFn({ yieldId, address, amount, decimals }) {
            const response = await enterYield({
                body: {
                    yieldId,
                    address,
                    arguments: { amount },
                },
            });

            const verification = verifyEnterTransactions(response, {
                address,
                amount,
                decimals,
            });

            return { response, verification };
        },
    });
}
