import { type ActionDto, type CreateActionDto } from '@suite-common/earn-stablecoin-defs';
import { desktopMutationKeys, useMutation } from '@suite-common/react-query';

import { exitYield } from '../services';
import { verifyExitTransactions } from '../verification/exit';
import { type VerificationStatus } from '../verification/shared';

type ExitYieldOpportunityVariables = Pick<CreateActionDto, 'yieldId' | 'address'> & {
    amount: string;
};

type ExitYieldOpportunityResult = {
    response: ActionDto;
    verification: VerificationStatus;
};

/**
 * Generate the transactions needed to exit a yield position
 */
export function useExitYieldOpportunity() {
    return useMutation<ExitYieldOpportunityResult, Error, ExitYieldOpportunityVariables>({
        mutationKey: desktopMutationKeys.exitYieldOpportunity,
        async mutationFn({ yieldId, address, amount }) {
            const response = await exitYield({
                body: {
                    yieldId,
                    address,
                    arguments: { amount },
                },
            });

            const verification = verifyExitTransactions(response, { address });

            return { response, verification };
        },
    });
}
