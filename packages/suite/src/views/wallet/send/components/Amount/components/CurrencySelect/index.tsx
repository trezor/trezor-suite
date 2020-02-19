import React from 'react';
import styled from 'styled-components';
import { Select } from '@trezor/components-v2';
import { Account } from '@wallet-types';
import { LABEL_HEIGHT } from '@wallet-constants/sendForm';

const Wrapper = styled.div`
    width: 100px;
    margin-left: 10px;
`;

const CurrencySelect = styled(Select)`
    margin-top: ${LABEL_HEIGHT}px;
`;

interface Props {
    symbol: Account['symbol'];
    tokens: Account['tokens'];
}

const getValues = (symbol: Account['symbol'], tokens: Account['tokens']) => {
    const result: {
        value: string;
        label: string;
    }[] = [
        {
            value: symbol,
            label: symbol.toUpperCase(),
        },
    ];

    if (tokens) {
        tokens.forEach(token => {
            const tokenName = token.symbol || 'N/A';
            result.push({
                value: tokenName,
                label: tokenName.toUpperCase(),
            });
        });
    }

    return result;
};

export default ({ symbol, tokens }: Props) => {
    const values = getValues(symbol, tokens);
    return (
        <Wrapper>
            <CurrencySelect
                key="currency"
                isSearchable={false}
                onChange={() => {}}
                isClearable={false}
                value={values[0]}
                isDisabled={values.length === 1}
                options={values}
            />
        </Wrapper>
    );
};
