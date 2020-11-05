import React from 'react';
import styled from 'styled-components';
import { Account } from '@wallet-types';
import { formatCoinBalance } from '@wallet-utils/balanceUtils';
import { HiddenPlaceholder } from '@suite-components';

const Wrapper = styled.div`
    padding-right: 10px;
`;
const Value = styled.span`
    font-variant-numeric: tabular-nums;
`;
const Symbol = styled.span`
    margin-left: 3px;
`;

interface Props {
    value: string;
    symbol: Account['symbol'];
}

const CoinBalance = ({ value, symbol }: Props) => (
    <Wrapper>
        <HiddenPlaceholder>
            <Value>{formatCoinBalance(value)}</Value>
            <Symbol>{symbol ? symbol.toUpperCase() : symbol}</Symbol>
        </HiddenPlaceholder>
    </Wrapper>
);

export default CoinBalance;
