import { AlertBox, HStack, Text, VStack } from '@suite-native/atoms';
import { ReviewOutputState } from '@suite-common/wallet-types';
import { ReviewOutputType } from '@suite-common/wallet-types';
import { CryptoAmountFormatter } from '@suite-native/formatters';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { StatefulReviewOutput } from '../types';

const getAlertBoxVariant = (state: ReviewOutputState) => {
    switch (state) {
        case 'active':
            return 'warning';
        case 'success':
            return 'success';
        default:
            return 'error';
    }
};

const ReviewOutputItemValue = ({
    outputType,
    networkSymbol,
    value,
}: {
    outputType: ReviewOutputType;
    value: string;
    networkSymbol: NetworkSymbol;
}) => {
    if (outputType === 'amount') {
        return (
            <CryptoAmountFormatter
                color="textDefault"
                variant="body"
                isBalance={false}
                value={value}
                network={networkSymbol}
            />
        );
    }

    return (
        <Text numberOfLines={1} adjustsFontSizeToFit>
            {value}
        </Text>
    );
};

// TODO: adjust UI to the design when ready
export const ReviewOutputItem = ({
    reviewOutput,
    networkSymbol,
}: {
    networkSymbol: NetworkSymbol;
    reviewOutput: StatefulReviewOutput;
    status: 'success' | 'active' | 'todo';
}) => {
    return (
        <VStack flex={1} justifyContent="center" alignItems="center">
            <HStack key={reviewOutput.label} alignItems="center" justifyContent="center">
                <Text>{reviewOutput.type}:</Text>
            </HStack>
            <AlertBox
                variant={getAlertBoxVariant(reviewOutput.state)}
                title={
                    <ReviewOutputItemValue
                        outputType={reviewOutput.type}
                        networkSymbol={networkSymbol}
                        value={reviewOutput.value}
                    />
                }
            />
        </VStack>
    );
};
