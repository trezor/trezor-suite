import { desktopMutationKeys, useMutation } from '@suite-common/react-query';

import { type CreateActionDto, type EnterYieldResponseSuccess, enterYield } from '../api';

type EnterYieldOpportunityVariables = Pick<CreateActionDto, 'yieldId' | 'address'> & {
    amount: string;
};

/**
 * Generate the transactions needed to enter a yield position
 * @url https://docs.yield.xyz/reference/actionscontroller_enteryield
 */
export function useEnterYieldOpportunity() {
    return useMutation<EnterYieldResponseSuccess, Error, EnterYieldOpportunityVariables>({
        mutationKey: desktopMutationKeys.enterYieldOpportunity,
        mutationFn({ yieldId, address, amount }) {
            return enterYield({
                yieldId,
                address,
                arguments: { amount },
            });
        },
    });
}
