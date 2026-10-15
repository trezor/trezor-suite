import { useMemo } from 'react';

import { useGetVaultByAddress } from '@suite-common/earn-stablecoin-api';
import { injectGetCalldata } from '@suite-common/networks';
import { type Account, type FormState } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';

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
    const { getCalldata } = useServices(injectGetCalldata);

    const networkType = account?.networkType;
    const outputs = precomposedForm?.outputs;
    const transactionData = precomposedForm?.transactionData;
    const outputToken = useMemo(() => {
        if (networkType !== 'ethereum' || !transactionData) {
            return undefined;
        }

        return getMatchAddress(getCalldata(account?.symbol), {
            to: outputs?.[0]?.address,
            data: transactionData,
        });
    }, [networkType, outputs, transactionData, getCalldata, account]);

    const { data: vault } = useGetVaultByAddress({ enabled, outputToken });

    return vault?.metadata?.name;
};
