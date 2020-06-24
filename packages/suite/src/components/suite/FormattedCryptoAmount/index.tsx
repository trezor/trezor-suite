import React from 'react';
import styled from 'styled-components';
import { HiddenPlaceholder } from '@suite-components';

const Value = styled.span`
    font-variant-numeric: tabular-nums;
`;
const Symbol = styled.span``;

interface Props {
    value: string;
    symbol?: string;
}

const FormattedCryptoAmount = ({ value, symbol }: Props) => (
    <HiddenPlaceholder>
        <Value>{value}</Value>
        {symbol && <Symbol>{` ${symbol.toUpperCase()}`}</Symbol>}
    </HiddenPlaceholder>
);

export default FormattedCryptoAmount;
