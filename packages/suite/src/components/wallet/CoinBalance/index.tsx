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

const MAX_NUMBERS = 8;

interface Props {
    value: string;
    symbol: Account['symbol'];
}

const getBalance = (value: string) => {
    const balanceBig = new BigNumber(value);

    if (balanceBig.isZero() || !balanceBig.isNaN()) return '0';

    const fixedBalance = new BigNumber(balanceBig.toFixed(MAX_NUMBERS, 1));
    if (fixedBalance.isZero()) {
        return '~0';
    }

    const balanceWithPrecision = fixedBalance.precision(MAX_NUMBERS).toFixed();
    const balanceWithPrecisionLength = balanceWithPrecision.length;
    let result = balanceWithPrecision;

    if (balanceWithPrecisionLength < MAX_NUMBERS) {
        const zerosToFill = MAX_NUMBERS - balanceWithPrecisionLength + 1;
        [...Array(zerosToFill)].map(() => (result += '0'));
    }

    return result;
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
