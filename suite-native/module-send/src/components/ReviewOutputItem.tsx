import { LayoutChangeEvent, View } from 'react-native';

import { ReviewOutputType } from '@suite-common/wallet-types';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { TxKeyPath, useTranslate } from '@suite-native/intl';

import { StatefulReviewOutput } from '../types';
import { ReviewOutputCard } from './ReviewOutputCard';
import { ReviewOutputItemContent } from './ReviewOutputItemContent';

type ReviewOutputItemProps = {
    networkSymbol: NetworkSymbol;
    reviewOutput: StatefulReviewOutput;
    onLayout: (event: LayoutChangeEvent) => void;
};

const outputLabelTranslationMap = {
    address: 'moduleSend.review.outputs.addressLabel',
    regular_legacy: 'moduleSend.review.outputs.addressLabel',
    amount: 'moduleSend.review.outputs.amountLabel',
} as const satisfies Partial<Record<ReviewOutputType, TxKeyPath>>;

const isTranslationDefined = (
    type: ReviewOutputType,
): type is keyof typeof outputLabelTranslationMap => {
    return type in outputLabelTranslationMap;
};

export const ReviewOutputItem = ({
    reviewOutput,
    networkSymbol,
    onLayout,
}: ReviewOutputItemProps) => {
    const { state, type, value } = reviewOutput;
    const { translate } = useTranslate();

    const titleTxKey = isTranslationDefined(type) ? outputLabelTranslationMap[type] : null;
    const title = titleTxKey ? translate(titleTxKey) : type;

    return (
        <View onLayout={onLayout}>
            <ReviewOutputCard title={title} outputState={state}>
                <ReviewOutputItemContent
                    outputType={type}
                    networkSymbol={networkSymbol}
                    value={value}
                />
            </ReviewOutputCard>
        </View>
    );
};
