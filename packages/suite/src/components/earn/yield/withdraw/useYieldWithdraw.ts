import { type EarnParams } from '@suite/router';
import { type Account } from '@suite-common/wallet-types';

import { type YieldFlowContextValues, useYieldFlow } from '../hooks/useYieldFlow';

type UseYieldWithdrawProps = {
    account: Account;
    routeParams: EarnParams;
};

export const useYieldWithdraw = ({
    account,
    routeParams,
}: UseYieldWithdrawProps): YieldFlowContextValues | null => {
    const flowResult = useYieldFlow({ account, routeParams, flowType: 'withdraw' });
    const { vault, token, receiptToken } = flowResult;

    if (!token || !receiptToken || !vault) {
        return null;
    }

    return { ...flowResult, token, receiptToken, vault };
};
