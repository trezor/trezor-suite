import { type EarnParams } from '@suite/router';
import { type Account } from '@suite-common/wallet-types';

import { type YieldFlowContextValues, useYieldFlow } from '../hooks/useYieldFlow';

type UseYieldSupplyProps = {
    account: Account;
    routeParams: EarnParams;
};

export const useYieldSupply = ({
    account,
    routeParams,
}: UseYieldSupplyProps): YieldFlowContextValues | null => {
    const flowResult = useYieldFlow({ account, routeParams, flowType: 'deposit' });
    const { vault, token, receiptToken } = flowResult;

    if (!token || !receiptToken || !vault) {
        return null;
    }

    return { ...flowResult, token, receiptToken, vault };
};
