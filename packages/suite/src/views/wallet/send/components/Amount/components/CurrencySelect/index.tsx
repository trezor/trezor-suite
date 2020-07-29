import React from 'react';
import styled from 'styled-components';
import { Select } from '@trezor/components';
import { Account } from '@wallet-types';
import { TokenInfo } from 'trezor-connect';

const Wrapper = styled.div`
    min-width: 110px;
    padding-left: 10px;
`;

interface Props {
    symbol: Account['symbol'];
    tokens: Account['tokens'];
    selectedToken?: TokenInfo;
    onChange: (token?: TokenInfo) => void;
}

interface Option {
    value?: TokenInfo;
    label: string;
}

const getValues = (symbol: Account['symbol'], tokens: Account['tokens']) => {
    const result: Option[] = [
        {
            value: undefined,
            label: symbol.toUpperCase(),
        },
    ];

    if (tokens) {
        tokens.forEach(token => {
            const tokenName = token.symbol || 'N/A';
            result.push({
                value: token,
                label: tokenName.toUpperCase(),
            });
        });
    }

    return result;
};

export default ({ symbol, tokens, selectedToken, onChange }: Props) => {
    const values = getValues(symbol, tokens);

    return (
        <Wrapper>
            <Select
                key="token"
                isSearchable={false}
                onChange={(t: Option) => onChange(t.value)}
                isClearable={false}
                value={values.find(v => v.value === selectedToken)}
                isDisabled={values.length === 1}
                options={values}
                display
            />
        </Wrapper>
    );
};
