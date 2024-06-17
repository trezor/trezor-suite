import { AlertBox, AlertBoxVariant, Box, Text, VStack } from '@suite-native/atoms';
import { ReviewOutputState } from '@suite-common/wallet-types';
import { ReviewOutputType } from '@suite-common/wallet-types';
import { CryptoAmountFormatter } from '@suite-native/formatters';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { StatefulReviewOutput } from '../types';

type ReviewOutputItemProps = {
    networkSymbol: NetworkSymbol;
    reviewOutput: StatefulReviewOutput;
    status: ReviewOutputState;
};

const alertBoxVariantMap = {
    active: 'warning',
    success: 'success',
} as const satisfies Record<Exclude<ReviewOutputState, undefined>, AlertBoxVariant>;

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

export const ReviewOutputItem = ({ reviewOutput, networkSymbol }: ReviewOutputItemProps) => {
    const alertBoxVariant = reviewOutput.state ? alertBoxVariantMap[reviewOutput.state] : 'error';

    return (
        <VStack flex={1} justifyContent="center" alignItems="center">
            <Box alignItems="center" justifyContent="center">
                <Text>{reviewOutput.type}:</Text>
            </Box>
            <AlertBox
                variant={alertBoxVariant}
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
