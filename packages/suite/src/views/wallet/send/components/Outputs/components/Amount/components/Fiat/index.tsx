import React, { useEffect } from 'react';
import BigNumber from 'bignumber.js';
import validator from 'validator';
import styled from 'styled-components';
import { Select, Input, SelectInput } from '@trezor/components';
import { Controller } from 'react-hook-form';
import { useSendFormContext } from '@wallet-hooks';
import { FIAT } from '@suite-config';
import { composeChange, updateFiatInput } from '@wallet-actions/sendFormActions';
import { fromFiatCurrency } from '@wallet-utils/fiatConverterUtils';
import { getInputState, getFiatRate, buildCurrencyOption } from '@wallet-utils/sendFormUtils';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: row;
    justify-content: flex-start;
`;

export default ({ outputId }: { outputId: number }) => {
    const {
        network,
        fiatRates,
        token,
        localCurrencyOption,
        register,
        values,
        errors,
        control,
        setValue,
        clearError,
        composeTransaction,
    } = useSendFormContext();

    const inputName = `outputs[${outputId}].fiat`;
    const amountInputName = `outputs[${outputId}].amount`;

    // find related amount error
    const amountError =
        errors.outputs && errors.outputs[outputId] ? errors.outputs[outputId].amount : undefined;
    // find local error
    const fiatError =
        errors.outputs && errors.outputs[outputId] ? errors.outputs[outputId].fiat : undefined;
    // display error only if there is no related amountError and local error is 'TR_AMOUNT_IS_NOT_SET' (empty field)
    const error =
        amountError && fiatError && fiatError.message === 'TR_AMOUNT_IS_NOT_SET'
            ? undefined
            : fiatError;

    const fiatValue =
        values.outputs && values.outputs[outputId] ? values.outputs[outputId].fiat : '';
    const decimals = token ? token.decimals : network.decimals;

    return (
        <Wrapper>
            <Input
                state={getInputState(error, fiatValue)}
                monospace
                bottomText={error && error.message}
                onChange={event => {
                    if (error) {
                        if (values.outputs[outputId].amount.length > 0) {
                            setValue(amountInputName, '', true);
                        }
                        return;
                    }
                    const selectedCurrency = values.outputs[outputId].currency;
                    const amount =
                        fiatRates && fiatRates.current
                            ? fromFiatCurrency(
                                  event.target.value,
                                  selectedCurrency.value,
                                  fiatRates.current.rates,
                                  decimals,
                              )
                            : null;
                    if (amount) {
                        // error needs to be cleared before updating value, otherwise react-select-hook will not propagate changes into contexts (cached error)
                        if (amountError) clearError(amountInputName);
                        setValue(amountInputName, amount, true);
                        composeTransaction(outputId);
                    }
                }}
                name={inputName}
                defaultValue={fiatValue}
                innerRef={register({
                    validate: (value: string) => {
                        if (!value || value.length === 0) {
                            return 'TR_AMOUNT_IS_NOT_SET';
                        }

                        const amountBig = new BigNumber(value);

                        if (amountBig.isNaN()) {
                            return 'TR_AMOUNT_IS_NOT_NUMBER';
                        }

                        if (amountBig.lt(0)) {
                            return 'TR_AMOUNT_IS_TOO_LOW';
                        }
                    },
                })}
                innerAddon={
                    <Controller
                        as={SelectInput}
                        options={FIAT.currencies.map((currency: string) =>
                            buildCurrencyOption(currency),
                        )}
                        name={`outputs[${outputId}].currency`}
                        register={register}
                        isSearchable
                        defaultValue={localCurrencyOption}
                        isClearable={false}
                        onChange={([selected]) => {
                            const rate = getFiatRate(fiatRates, selected.value);
                            const amountValue = new BigNumber(values.outputs[outputId].amount);
                            if (rate && amountValue && !amountValue.isNaN()) {
                                const fiatValueBigNumber = amountValue.multipliedBy(rate);
                                setValue(inputName, fiatValueBigNumber.toFixed(2), true);
                            }
                            return selected;
                        }}
                        control={control}
                        minWidth="45px"
                    />
                }
            />
        </Wrapper>
    );
};
