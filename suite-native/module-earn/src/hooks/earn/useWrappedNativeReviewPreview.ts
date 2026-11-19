import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectSelectedDevice } from '@suite-common/device';
import { type WrappedNativeFlowType } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import { getWrappedNativeTransactionToken } from '../../utils/earn/wrappedNativeTransactionTokenUtils';
import { buildYieldReviewPreview } from '../../utils/yield/yieldReviewOutputUtils';

type UseWrappedNativeReviewPreviewParams = {
    account: Account | null | undefined;
    amount: string | undefined;
    flowType: WrappedNativeFlowType;
    unsignedTransaction: string | undefined;
};

export const useWrappedNativeReviewPreview = ({
    account,
    amount,
    flowType,
    unsignedTransaction,
}: UseWrappedNativeReviewPreviewParams) => {
    const device = useSelector(selectSelectedDevice);

    return useMemo(() => {
        if (!account || !device || amount === undefined || !unsignedTransaction) {
            return null;
        }

        const transactionToken = getWrappedNativeTransactionToken(account.symbol, flowType);

        if (flowType === 'unwrap' && !transactionToken) {
            return null;
        }

        return buildYieldReviewPreview({
            account,
            device,
            review: { amount, unsignedTransaction },
            transactionToken,
            type: flowType,
        });
    }, [account, amount, device, flowType, unsignedTransaction]);
};
