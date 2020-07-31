import React from 'react';
import styled from 'styled-components';
import { HiddenPlaceholder } from '@suite-components';

const Value = styled.span`
    font-variant-numeric: tabular-nums;
`;
const Symbol = styled.span``;

interface Props {
    value: React.ReactNode;
    symbol?: string;
    disableHiddenPlaceholder?: boolean;
    className?: string;
}

const FormattedCryptoAmount = ({ value, symbol, disableHiddenPlaceholder, className }: Props) => {
    const content = (
        <>
            <Value>{value}</Value>
            {symbol && <Symbol>{` ${symbol.toUpperCase()}`}</Symbol>}
        </>
    );

    if (disableHiddenPlaceholder) {
        return content;
    }
    return <HiddenPlaceholder className={className}>{content}</HiddenPlaceholder>;
};

export default FormattedCryptoAmount;
