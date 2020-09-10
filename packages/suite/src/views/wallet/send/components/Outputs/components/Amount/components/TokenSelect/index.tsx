import React from 'react';
import { Controller } from 'react-hook-form';
import { SelectInput } from '@trezor/components';
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
        getValues,
        getDefaultValue,
        toggleOption,
        composeTransaction,
        watch,
    } = useSendFormContext();

    const tokenInputName = `outputs[${outputId}].token`;
    const amountInputName = `outputs[${outputId}].amount`;
    const tokenValue = getDefaultValue(tokenInputName, outputs[outputId].token);
    const isSetMaxActive = getDefaultValue('setMaxOutputId') === outputId;
    const dataEnabled = getDefaultValue('options', []).includes('ethereumData');
    const options = buildTokenOptions(account);

    // Amount needs to be re-validated again AFTER token change propagation (decimal places, available balance)
    // watch token change and use "useSendFormFields.setAmount" util for validation (if amount is set)
    // if Amount is not valid 'react-hook-form' will set an error to it, and composeTransaction will be prevented
    // N0TE: do this conditionally only for ETH and when set-max is not enabled
    if (account.networkType === 'ethereum' && !isSetMaxActive) {
        const tokenWatch = watch(tokenInputName, null);
        React.useEffect(() => {
            const amountValue = getValues(`outputs[${outputId}].amount`) as string;
            if (amountValue) setAmount(outputId, amountValue);
        }, [outputId, tokenWatch, setAmount, getValues]);
    }

    return (
        <Controller
            control={control}
            name={tokenInputName}
            data-test={tokenInputName}
            defaultValue={tokenValue}
            render={({ onChange }) => {
                return (
                    <SelectInput
                        options={options}
                        isSearchable
                        value={options.find(o => o.value === tokenValue)}
                        isClearable={false}
                        minWidth="45px"
                        onChange={async (selected: Option) => {
                            // change selected value
                            onChange(selected.value);
                            // clear errors in Amount input
                            clearErrors(amountInputName);
                            // remove Amount if isSetMaxActive or ETH data options are enabled
                            if (isSetMaxActive || dataEnabled) setAmount(outputId, '');
                            // remove ETH data option
                            if (dataEnabled) toggleOption('ethereumData');
                            // compose (could be prevented because of Amount error from re-validation above)
                            composeTransaction(amountInputName);
                        }}
                    />
                );
            }}
        />
    );
};
