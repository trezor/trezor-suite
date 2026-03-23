import { desktopMutationKeys, useMutation } from '@suite-common/react-query';

import { type CreateActionDto, type ExitYieldResponseSuccess, exitYield } from '../api';
import { verifyExitTransactions } from '../verification/exit';
import { type VerificationStatus } from '../verification/shared';

type ExitYieldOpportunityVariables = Pick<CreateActionDto, 'yieldId' | 'address'> & {
    amount: string;
};

type ExitYieldOpportunityResult = {
    response: ExitYieldResponseSuccess;
    verification: VerificationStatus;
};

/**
 * Generate the transactions needed to exit a yield position
 * @url https://docs.yield.xyz/reference/actionscontroller_exityield
 */
export function useExitYieldOpportunity() {
    return useMutation<ExitYieldOpportunityResult, Error, ExitYieldOpportunityVariables>({
        mutationKey: desktopMutationKeys.exitYieldOpportunity,
        async mutationFn({ yieldId, address, amount }) {
            const response = await exitYield({
                yieldId,
                address,
                arguments: { amount },
            });

            const verification = verifyExitTransactions(response, { yieldId, address });

            return { response, verification };
        },
    });
}
