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
type SupportedOutputType = Extract<ReviewOutputType, 'amount' | 'address'>;

const outputLabelTranslationMap = {
    address: 'moduleSend.review.outputs.addressLabel',
    amount: 'moduleSend.review.outputs.amountLabel',
} as const satisfies Record<SupportedOutputType, TxKeyPath>;

export const ReviewOutputItem = ({
    reviewOutput,
    networkSymbol,
    onLayout,
}: ReviewOutputItemProps) => {
    const { translate } = useTranslate();

    const { state, type, value } = reviewOutput;

    return (
        <View onLayout={onLayout}>
            <ReviewOutputCard
                title={translate(outputLabelTranslationMap[type as SupportedOutputType])}
                outputState={state}
            >
                <ReviewOutputItemContent
                    outputType={type}
                    networkSymbol={networkSymbol}
                    value={value}
                />
            </ReviewOutputCard>
        </View>
    );
};
