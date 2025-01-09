import { LayoutChangeEvent, View } from 'react-native';

import { ReviewOutputType } from '@suite-common/wallet-types';
import { TxKeyPath, useTranslate } from '@suite-native/intl';

import { StatefulReviewOutput } from '../types';
import { ReviewOutputCard } from './ReviewOutputCard';
import { ReviewOutputItemContent } from './ReviewOutputItemContent';

type ReviewOutputItemProps = {
    reviewOutput: StatefulReviewOutput;
    onLayout: (event: LayoutChangeEvent) => void;
};

const outputLabelTranslationMap = {
    address: 'moduleSend.review.outputs.addressLabel',
    regular_legacy: 'moduleSend.review.outputs.addressLabel',
    amount: 'moduleSend.review.outputs.amountLabel',
    'destination-tag': 'moduleSend.review.outputs.destinationTagLabel',
    contract: 'moduleSend.review.outputs.contractLabel',
} as const satisfies Partial<Record<ReviewOutputType, TxKeyPath>>;

const isTranslationDefined = (
    type: ReviewOutputType,
): type is keyof typeof outputLabelTranslationMap => type in outputLabelTranslationMap;

export const ReviewOutputItem = ({ reviewOutput, onLayout }: ReviewOutputItemProps) => {
    const { state, type, value } = reviewOutput;
    const { translate } = useTranslate();

    const titleTxKey = isTranslationDefined(type) ? outputLabelTranslationMap[type] : null;
    const title = titleTxKey ? translate(titleTxKey) : type;

    return (
        <View onLayout={onLayout}>
            <ReviewOutputCard title={title} outputState={state}>
                <ReviewOutputItemContent outputType={type} value={value} />
            </ReviewOutputCard>
        </View>
    );
};
