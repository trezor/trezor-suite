import React from 'react';
import styled from 'styled-components';
import { Account } from '@wallet-types';
import { formatCoinBalance } from '@wallet-utils/balanceUtils';
import { HiddenPlaceholder } from '@suite-components';

const Wrapper = styled.div`
    display: flex;
`;

const Value = styled.span``;

const Symbol = styled.span`
    text-indent: 3px;
`;

interface Props {
    value: string;
    symbol: Account['symbol'];
}

export default ({ value, symbol }: Props) => {
    const coinBalance = formatCoinBalance(value);
    return (
        <HiddenPlaceholder>
            <Wrapper>
                <Value>{coinBalance}</Value>
                <Symbol>{symbol ? symbol.toUpperCase() : symbol}</Symbol>
            </Wrapper>
        </HiddenPlaceholder>
    );
};
