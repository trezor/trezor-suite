import React from 'react';
import { Controller } from 'react-hook-form';
import { CleanSelect } from '@trezor/components';
import { useSendFormContext } from '@wallet-hooks';
import { Account } from '@wallet-types';

interface Option {
    label: string;
    value: string | null;
}

export const buildTokenOptions = (account: Account) => {
    const result: Option[] = [
        {
            value: null,
            label: account.symbol.toUpperCase(),
        },
    ];

    if (account.tokens) {
        account.tokens.forEach(token => {
            const tokenName = token.symbol || 'N/A';
            result.push({
                value: token.address,
                label: tokenName.toUpperCase(),
            });
        });
    }

    return result;
};

export default ({ outputId }: { outputId: number }) => {
    const {
        outputs,
        account,
        clearErrors,
        control,
        setAmount,
        getDefaultValue,
        toggleOption,
        composeTransaction,
    } = useSendFormContext();

    const tokenInputName = `outputs[${outputId}].token`;
    const amountInputName = `outputs[${outputId}].amount`;
    const tokenValue = getDefaultValue(tokenInputName, outputs[outputId].token);
    const isSetMaxActive = getDefaultValue('setMaxOutputId') === outputId;
    const dataEnabled = getDefaultValue('options', []).includes('ethereumData');
    const options = buildTokenOptions(account);

    return (
        <Controller
            control={control}
            name={tokenInputName}
            data-test={tokenInputName}
            defaultValue={tokenValue}
            render={({ onChange }) => {
                return (
                    <CleanSelect
                        options={options}
                        isSearchable
                        value={options.find(o => o.value === tokenValue)}
                        isClearable={false}
                        minWidth="45px"
                        onChange={(selected: Option) => {
                            onChange(selected.value);
                            clearErrors(amountInputName);
                            if (isSetMaxActive || dataEnabled) setAmount(outputId, '');
                            if (dataEnabled) toggleOption('ethereumData');
                            composeTransaction(amountInputName);
                        }}
                    />
                );
            }}
        />
    );
};
