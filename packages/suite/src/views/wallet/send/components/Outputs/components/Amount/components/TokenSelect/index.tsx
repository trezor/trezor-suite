import React from 'react';
import { Controller } from 'react-hook-form';
import { SelectInput } from '@trezor/components';
import { useSendFormContext } from '@wallet-hooks';
import { buildTokenOptions } from '@wallet-utils/sendFormUtils';

export default ({ outputId }: { outputId: number }) => {
    const {
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
    const tokenValue = getDefaultValue<string, string | undefined>(tokenInputName, undefined);
    const isSetMaxActive = getDefaultValue('setMaxOutputId') === outputId;
    const dataEnabled = getDefaultValue('options', []).includes('ethereumData');
    const options = buildTokenOptions(account);

    return (
        <Controller
            control={control}
            name={tokenInputName}
            data-test={tokenInputName}
            render={({ onChange }) => {
                return (
                    <SelectInput
                        options={options}
                        isSearchable
                        value={options.find(o => o.value === tokenValue)}
                        isClearable={false}
                        minWidth="45px"
                        onChange={(selected: { value: string }) => {
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
