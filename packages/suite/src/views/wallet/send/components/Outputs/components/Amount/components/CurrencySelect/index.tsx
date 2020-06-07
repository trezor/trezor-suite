import React from 'react';
import styled from 'styled-components';
import { Select } from '@trezor/components';
import { Account } from '@wallet-types';
import { TokenInfo } from 'trezor-connect';
import { LABEL_HEIGHT } from '@wallet-constants/sendForm';
import { useSendContext } from '@suite/hooks/wallet/useSendContext';

const Wrapper = styled.div`
    min-width: 110px;
`;

const CurrencySelect = styled(Select)`
    margin-top: ${LABEL_HEIGHT}px;
`;

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

export default () => {
    const { account, setToken, token } = useSendContext();
    const { symbol, tokens } = account;
    const values = getValues(symbol, tokens);

    return (
        <Wrapper>
            <CurrencySelect
                key="token"
                isSearchable={false}
                onChange={(t: Option) => setToken(t.value || null)}
                isClearable={false}
                value={values.find(v => v.value === token?.symbol)}
                isDisabled={values.length === 1}
                options={values}
                display
            />
        </Wrapper>
    );
};
