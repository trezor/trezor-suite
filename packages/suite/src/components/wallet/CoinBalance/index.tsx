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

const getBalance = (value: string) => {
    const balanceBig = new BigNumber(value);

    if (balanceBig.isZero()) return '0';

    const fixedBalance = new BigNumber(balanceBig.toFixed(MAX_DECIMALS, 1));

    if (fixedBalance.isEqualTo(balanceBig)) {
        return fixedBalance.toFixed();
    }

    return `~ ${fixedBalance.toFixed()}`;
};

export default ({ value, symbol }: Props) => {
    return (
        <HiddenPlaceholder>
            <Wrapper>
                <Value>{getBalance(value)}</Value>
                <Symbol>{symbol ? symbol.toUpperCase() : symbol}</Symbol>
            </Wrapper>
        </HiddenPlaceholder>
    );
};
