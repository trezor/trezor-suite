import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { type Account } from '@suite-common/wallet-types';

import { type YieldFlowContextValues, useYieldFlow } from '../hooks/useYieldFlow';

type UseYieldDepositProps = {
    account: Account;
    vault: YieldDtoV2;
};

export const useYieldDeposit = ({
    account,
    vault,
}: UseYieldDepositProps): YieldFlowContextValues | null => {
    const flowResult = useYieldFlow({
        account,
        vault,
        flowType: 'deposit',
    });
    const { token, receiptToken } = flowResult;

    if (!token || !receiptToken) {
        return null;
    }

    return { ...flowResult, token, receiptToken };
};
