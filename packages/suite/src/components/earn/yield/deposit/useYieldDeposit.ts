import { type EarnParams } from '@suite/router';
import { type YieldDto } from '@suite-common/earn-stablecoin-api';
import { type Account } from '@suite-common/wallet-types';

import { type YieldFlowContextValues, useYieldFlow } from '../hooks/useYieldFlow';

type UseYieldDepositProps = {
    account: Account;
    routeParams: EarnParams;
    vault: YieldDto;
};

export const useYieldDeposit = ({
    account,
    routeParams,
    vault,
}: UseYieldDepositProps): YieldFlowContextValues | null => {
    const flowResult = useYieldFlow({
        account,
        routeParams,
        vault,
        flowType: 'deposit',
    });
    const { token, receiptToken } = flowResult;

    if (!token || !receiptToken) {
        return null;
    }

    return { ...flowResult, token, receiptToken };
};
