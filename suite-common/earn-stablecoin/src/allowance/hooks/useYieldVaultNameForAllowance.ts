import { useMemo } from 'react';

import { useAllYieldOpportunities } from '@suite-common/earn-stablecoin-api';
import { type Account, type FormState } from '@suite-common/wallet-types';
import {
    getEvmTransactionTextSignature,
    isEvmApprovalTxByTextSignature,
} from '@suite-common/wallet-utils';

import { getYieldVaultFromTx } from '../utils/getYieldVaultFromTx';

type UseYieldVaultNameParams = {
    account?: Account;
    precomposedForm?: FormState;
};

/**
 * Resolves the canonical vault name for the approve/revoke transaction review row.
 *
 * Deposit/withdraw/redeem reviews read the name from `yieldMetadata.vaultName`
 * (populated by the submit thunks), so this hook only resolves it for EVM
 * approve/revoke transactions, which are composed by the generic allowance flow
 * and carry no `yieldMetadata`.
 *
 * The yield-opportunities query is gated so it never fires for non-approve sends;
 * when it does run, the data is already warm in the React Query cache from the earn flow.
 */
export const useYieldVaultNameForAllowance = ({
    account,
    precomposedForm,
}: UseYieldVaultNameParams): string | undefined => {
    const isAllowanceReview =
        account?.networkType === 'ethereum' &&
        isEvmApprovalTxByTextSignature(
            getEvmTransactionTextSignature(precomposedForm?.transactionData),
        );

    const { data: yieldOpportunities } = useAllYieldOpportunities({ enabled: isAllowanceReview });

    return useMemo(() => {
        if (!isAllowanceReview) return undefined;

        const vault = getYieldVaultFromTx(
            { data: precomposedForm?.transactionData },
            yieldOpportunities,
        );

        return vault?.metadata?.name;
    }, [isAllowanceReview, precomposedForm?.transactionData, yieldOpportunities]);
};
