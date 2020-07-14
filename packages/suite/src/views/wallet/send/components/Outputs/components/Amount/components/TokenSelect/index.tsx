import React from 'react';
import { SelectInput } from '@trezor/components';
import { Account } from '@wallet-types';
import { TokenInfo } from 'trezor-connect';
import { useSendFormContext } from '@wallet-hooks';

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

export default ({ outputId }: { outputId: number }) => {
    const { account, token, updateContext, setValue, clearError } = useSendFormContext();
    const { symbol, tokens } = account;
    const values = getValues(symbol, tokens);

    return (
        <SelectInput
            key="token"
            onChange={(option: Option) => {
                updateContext({ token: option.value });
                setValue(`amount[${outputId}]`, '');
                clearError(`amount[${outputId}]`);
            }}
            value={values.find((option: Option) => option.value === token?.symbol)}
            options={values}
            minWidth="60px"
        />
    );
};
