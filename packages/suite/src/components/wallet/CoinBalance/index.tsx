import React from 'react';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';
import { Account } from '@wallet-types';
import { HiddenPlaceholder } from '@suite-components';

const Wrapper = styled.div`
    display: flex;
`;

const Value = styled.span``;

const Symbol = styled.span`
    text-indent: 3px;
`;

const MAX_DECIMALS = 8;

interface Props {
    value: string;
    symbol: Account['symbol'];
}

export default ({ value, symbol }: Props) => {
    const balanceBig = new BigNumber(value);
    return (
        <HiddenPlaceholder>
            <Wrapper>
                <Value>{balanceBig.toFixed(MAX_DECIMALS)}</Value>
                <Symbol>{symbol ? symbol.toUpperCase() : symbol}</Symbol>
            </Wrapper>
        </HiddenPlaceholder>
    );
};
