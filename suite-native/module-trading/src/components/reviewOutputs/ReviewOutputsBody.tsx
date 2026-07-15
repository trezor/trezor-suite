import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { type ExchangeFlowType } from '@suite-native/navigation';
import { getFormDraftKeyPrefixFromTradingType } from '@suite-native/trading-quote-utils';
import { ReviewOutputItemList } from '@suite-native/transaction-management';

import { ReviewOutputsSkeleton } from './ReviewOutputsSkeleton';
import { SignDataMessageReview } from './SignDataMessageReview';
import { useTradingContentBuilder } from '../../hooks/reviewOutputs/useTradingContentBuilder';

export type ReviewOutputsBodyProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
    exchangeFlowType?: ExchangeFlowType;
    shouldDisplayReviewList: boolean;
    tradingType: 'exchange' | 'sell';
};

export const ReviewOutputsBody = ({
    accountKey,
    tokenContract,
    exchangeFlowType,
    shouldDisplayReviewList,
    tradingType,
}: ReviewOutputsBodyProps) => {
    const contentBuilder = useTradingContentBuilder();

    if (exchangeFlowType === 'sign-data') {
        return <SignDataMessageReview />;
    }

    if (shouldDisplayReviewList) {
        const prefix = getFormDraftKeyPrefixFromTradingType(tradingType);

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
