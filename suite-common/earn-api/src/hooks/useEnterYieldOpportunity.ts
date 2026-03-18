import { desktopMutationKeys, useMutation } from '@suite-common/react-query';

import { type CreateActionDto, type EnterYieldResponseSuccess, enterYield } from '../api';
import { verifyEnterTransactions } from '../verification/enter';
import { type VerificationStatus } from '../verification/shared';

type EnterYieldOpportunityVariables = Pick<CreateActionDto, 'yieldId' | 'address'> & {
    amount: string;
    decimals: number;
};

type EnterYieldOpportunityResult = {
    response: EnterYieldResponseSuccess;
    verification: VerificationStatus;
};

/**
 * Generate the transactions needed to enter a yield position
 * @url https://docs.yield.xyz/reference/actionscontroller_enteryield
 */
export function useEnterYieldOpportunity() {
    return useMutation<EnterYieldOpportunityResult, Error, EnterYieldOpportunityVariables>({
        mutationKey: desktopMutationKeys.enterYieldOpportunity,
        async mutationFn({ yieldId, address, amount, decimals }) {
            const response = await enterYield({
                yieldId,
                address,
                arguments: { amount },
            });

            const verification = verifyEnterTransactions(response, {
                yieldId,
                address,
                amount,
                decimals,
            });

            return { response, verification };
        },
    });
}
