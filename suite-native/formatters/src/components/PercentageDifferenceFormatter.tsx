import React from 'react';

import { Text, TextProps } from '@suite-native/atoms';
import { useFormatters } from '@suite-common/formatters';

type NumberValues = number;
type PercentageDifferenceFormatterProps = {
    oldValue: NumberValues;
    newValue: NumberValues;
} & TextProps;

const calculatePercentageDifference = (a: number, b: number) =>
    Math.abs(Math.round(((a - b) / b) * 100));

export const PercentageDifferenceFormatter = ({
    oldValue,
    newValue,
    ...rest
}: PercentageDifferenceFormatterProps) => {
    const { SignValueFormatter } = useFormatters();

    const hasPriceIncreased = oldValue < newValue;

    return (
        <Text color={hasPriceIncreased ? 'green' : 'red'} {...rest}>
            <SignValueFormatter value={hasPriceIncreased ? 'positive' : 'negative'} />
            {calculatePercentageDifference(oldValue, newValue)}%
        </Text>
    );
};
