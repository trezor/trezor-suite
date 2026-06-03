import { useMemo } from 'react';

import { useGetVaultByAddress } from '@suite-common/earn-stablecoin-api';
import { type Account, type FormState } from '@suite-common/wallet-types';

import { getMatchAddress } from '../utils/getMatchAddress';

type UseYieldVaultNameParams = {
    account?: Account;
    precomposedForm?: FormState;
    enabled?: boolean;
};

/**
 * - Resolves the canonical vault name for all Yield flows.
 * - Runs for EVM 'deposit', 'withdraw', 'redeem', 'approve', 'revoke' flows.
 */
export const useYieldVaultName = ({
    enabled,
    account,
    precomposedForm,
}: UseYieldVaultNameParams): string | undefined => {
    const outputToken = useMemo(() => {
        if (account?.networkType !== 'ethereum' || !precomposedForm?.transactionData) {
            return undefined;
        }

        return getMatchAddress({
            to: precomposedForm.outputs?.[0]?.address,
            data: precomposedForm.transactionData,
        });
    }, [account?.networkType, precomposedForm?.outputs, precomposedForm?.transactionData]);

    const { data: vault } = useGetVaultByAddress({ enabled, outputToken });

    return vault?.metadata?.name;
};
