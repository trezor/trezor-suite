import React from 'react';

import { Text, TextProps } from '@suite-native/atoms';
import { useFormatters } from '@suite-common/formatters';

import { FormatterProps } from '../types';

type NumberValues = number;
type PercentageDifferenceFormatterProps = FormatterProps<NumberValues> & {
    secondValue: NumberValues;
} & TextProps;

const calculatePercentageDifference = (a: number, b: number) =>
    Math.abs(Math.round(((a - b) / b) * 100));

export const PercentageDifferenceFormatter = ({
    value,
    secondValue,
    ...rest
}: PercentageDifferenceFormatterProps) => {
    const { SignValueFormatter } = useFormatters();

    const hasPriceIncreased = value < secondValue;

    return (
        <Text color={hasPriceIncreased ? 'green' : 'red'} {...rest}>
            <SignValueFormatter value={hasPriceIncreased ? 'positive' : 'negative'} />
            {calculatePercentageDifference(value, secondValue)}%
        </Text>
    );
};
