import { type LayoutChangeEvent, View } from 'react-native';

import {
    type AccountKey,
    type ReviewOutputType,
    type TokenAddress,
} from '@suite-common/wallet-types';
import { type TxKeyPath, useTranslate } from '@suite-native/intl';

import { ReviewOutputCard } from './ReviewOutputCard';
import { ReviewOutputItemContent } from './ReviewOutputItemContent';
import { type StatefulReviewOutput } from '../../types';

export type ReviewOutputItemProps = {
    accountKey: AccountKey;
    reviewOutput: StatefulReviewOutput;
    onLayout: (event: LayoutChangeEvent) => void;
    tokenContract?: TokenAddress;
};

const outputLabelTranslationMap = {
    address: 'transactionManagement.review.outputs.addressLabel',
    regular_legacy: 'transactionManagement.review.outputs.addressLabel',
    amount: 'transactionManagement.review.outputs.amountLabel',
    'destination-tag': 'transactionManagement.review.outputs.destinationTagLabel',
    contract: 'transactionManagement.review.outputs.contractLabel',
    timebounds: 'transactionManagement.review.outputs.timeboundsLabel',
    'signing-with': 'transactionManagement.review.outputs.signingWithLabel',
    network: 'transactionManagement.review.outputs.networkLabel',
} as const satisfies Partial<Record<ReviewOutputType, TxKeyPath>>;

const isTranslationDefined = (
    type: ReviewOutputType,
): type is keyof typeof outputLabelTranslationMap => type in outputLabelTranslationMap;

export const ReviewOutputItem = ({
    accountKey,
    reviewOutput,
    onLayout,
    tokenContract,
}: ReviewOutputItemProps) => {
    const { translate } = useTranslate();

    const { state, type, value } = reviewOutput;
    const title = isTranslationDefined(type) ? translate(outputLabelTranslationMap[type]) : type;

    return (
        <View onLayout={onLayout}>
            <ReviewOutputCard title={title} outputState={state}>
                <ReviewOutputItemContent
                    accountKey={accountKey}
                    outputType={type}
                    value={value}
                    tokenContract={tokenContract}
                />
            </ReviewOutputCard>
        </View>
    );
};
