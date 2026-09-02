import { useSelector } from 'react-redux';

import {
    type AccountsRootState,
    type WrappedNativeFlowType,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';

import { WrappedNativeTokenReviewContent } from './WrappedNativeTokenReviewContent';
import { useWrappedNativeReviewPreview } from '../../hooks/earn/useWrappedNativeReviewPreview';

type StandaloneWrappedNativeReviewProps = {
    accountKey: AccountKey;
    amount: string;
    flowType: WrappedNativeFlowType;
    unsignedTransaction: string;
};

/** Data wiring shared by the standalone wrap and unwrap review screens. */
export const StandaloneWrappedNativeReview = ({
    accountKey,
    amount,
    flowType,
    unsignedTransaction,
}: StandaloneWrappedNativeReviewProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const { preview, spentToken } = useWrappedNativeReviewPreview({
        account,
        amount,
        flowType,
        unsignedTransaction,
    });

    if (!account || !spentToken || !preview) {
        return null;
    }

    return (
        <WrappedNativeTokenReviewContent
            account={account}
            amount={amount}
            flowContext="standalone"
            flowType={flowType}
            preview={preview}
            spentToken={spentToken}
            unsignedTransaction={unsignedTransaction}
        />
    );
};
