import {
    type Account,
    type FormState,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { type NativeAnalyticsDep, events } from '@suite-native/analytics';

import { type YieldApprovalLimitType } from '../../types';

export const getYieldApprovalAnalyticsType = (
    approvalLimitType: YieldApprovalLimitType | undefined,
): 'INFINITE' | 'MINIMAL' | undefined => {
    if (approvalLimitType === undefined) {
        return undefined;
    }

    return approvalLimitType === 'unlimited' ? 'INFINITE' : 'MINIMAL';
};

type ReportYieldTransactionDispatchedParams = {
    analytics: NativeAnalyticsDep['analytics'];
    account: Account;
    precomposedTransaction: PrecomposedTransactionFinal;
    precomposedForm: FormState;
};

export const reportYieldTransactionDispatched = ({
    analytics,
    account,
    precomposedTransaction,
    precomposedForm,
}: ReportYieldTransactionDispatchedParams) =>
    analytics.report({
        type: events.sendTransactionDispatchedEvent.name,
        payload: {
            symbol: account.symbol,
            outputsCount: precomposedTransaction.outputs.length,
            selectedFee: precomposedForm.selectedFee ?? 'normal',
            txType: 'yield',
        },
    });
