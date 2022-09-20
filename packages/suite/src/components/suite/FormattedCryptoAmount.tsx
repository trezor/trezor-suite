import React from 'react';
import styled from 'styled-components';

import { HiddenPlaceholder, Sign } from '@suite-components';
import { SignValue } from '@suite-common/suite-types';
import { useFormatters } from '@suite-common/formatters';

const Container = styled.span`
    max-width: 100%;
`;

const Value = styled.span`
    font-variant-numeric: tabular-nums;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const Symbol = styled.span`
    word-break: initial;
`;

interface FormattedCryptoAmountProps {
    value: string | number | undefined;
    symbol: string | undefined;
    isBalance?: boolean;
    signValue?: SignValue;
    disableHiddenPlaceholder?: boolean;
    isRawString?: boolean;
    'data-test'?: string;
    className?: string;
}

export const FormattedCryptoAmount = ({
    value,
    symbol,
    isBalance,
    signValue,
    disableHiddenPlaceholder,
    isRawString,
    'data-test': dataTest,
    className,
}: FormattedCryptoAmountProps) => {
    const { cryptoAmountFormatter, signValueFormatter, currencySymbolFormatter } = useFormatters();

    if (!value) {
        return null;
    }

    const formattedSymbol = symbol ? currencySymbolFormatter.format(symbol) : '';
    const formattedValue = cryptoAmountFormatter.format(value, {
        isBalance,
        symbol,
    });

    // output as a string, mostly for compatability with graphs
    if (isRawString) {
        const displayedSignValue = signValueFormatter.format(signValue);
        return <>{`${displayedSignValue} ${formattedValue} ${formattedSymbol}`}</>;
    }

    const content = (
        <Container className={className}>
            {signValue && <Sign value={signValue} />}

            <Value data-test={dataTest}>{formattedValue}</Value>

            {symbol && <Symbol>&nbsp;{formattedSymbol}</Symbol>}
        </Container>
    );

    if (disableHiddenPlaceholder) {
        return content;
    }

    return <HiddenPlaceholder className={className}>{content}</HiddenPlaceholder>;
};
