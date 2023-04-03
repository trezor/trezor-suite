import React from 'react';

import { Text, TextProps } from '@suite-native/atoms';
import { useFormatters } from '@suite-common/formatters';
import { SignValue } from '@suite-common/suite-types';

import { FormatterProps } from '../types';

type SignValueFormatterProps = FormatterProps<SignValue | undefined> & Omit<TextProps, 'color'>;

export const SignValueFormatter = ({ value, ...textProps }: SignValueFormatterProps) => {
    const { SignValueFormatter: Formatter } = useFormatters();

    if (!value) return null;

    return (
        <Text
            {...textProps}
            color={value === 'positive' ? 'textSecondaryHighlight' : 'textAlertRed'}
        >
            {/* Trailing whitespace to offset a following value. */}
            <Formatter value={value} />{' '}
        </Text>
    );
};
