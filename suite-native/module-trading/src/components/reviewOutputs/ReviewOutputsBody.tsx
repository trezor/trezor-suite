import {
    type AccountKey,
    type FormDraftWithSendKeyPrefix,
    type TokenAddress,
} from '@suite-common/wallet-types';
import { type ExchangeFlowType } from '@suite-native/navigation';
import { ReviewOutputItemList } from '@suite-native/transaction-management';

import { ReviewOutputsSkeleton } from './ReviewOutputsSkeleton';
import { SignDataMessageReview } from './SignDataMessageReview';
import { useTradingContentBuilder } from '../../hooks/reviewOutputs/useTradingContentBuilder';

export type ReviewOutputsBodyProps = {
    prefix: FormDraftWithSendKeyPrefix;
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
    exchangeFlowType?: ExchangeFlowType;
    shouldDisplayReviewList: boolean;
};

export const ReviewOutputsBody = ({
    prefix,
    accountKey,
    tokenContract,
    exchangeFlowType,
    shouldDisplayReviewList,
}: ReviewOutputsBodyProps) => {
    const contentBuilder = useTradingContentBuilder();

    if (exchangeFlowType === 'sign-data') {
        return <SignDataMessageReview />;
    }

    if (shouldDisplayReviewList) {
        return (
            <ReviewOutputItemList
                prefix={prefix}
                accountKey={accountKey}
                tokenContract={tokenContract}
                flowType={exchangeFlowType}
                contentBuilder={contentBuilder}
            />
        );
    }

    return <ReviewOutputsSkeleton />;
};
