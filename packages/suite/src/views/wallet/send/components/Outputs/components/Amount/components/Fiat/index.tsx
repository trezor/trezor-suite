import React from 'react';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';
import { Input, SelectInput } from '@trezor/components';
import { InputError } from '@wallet-components';
import { Controller } from 'react-hook-form';
import { useSendFormContext } from '@wallet-hooks';
import { FIAT } from '@suite-config';
import { fromFiatCurrency } from '@wallet-utils/fiatConverterUtils';
import { getInputState, getFiatRate, findToken } from '@wallet-utils/sendFormUtils';
import { CurrencyOption } from '@wallet-types/sendForm';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: row;
    justify-content: flex-start;
`;

export const buildCurrencyOptions = () => {
    const result: CurrencyOption[] = [];
    FIAT.currencies.forEach(currency =>
        result.push({ value: currency, label: currency.toUpperCase() }),
    );
    return result;
};

export default ({ outputId }: { outputId: number }) => {
    const {
        account,
        network,
        fiatRates,
        register,
        errors,
        outputs,
        getDefaultValue,
        control,
        setValue,
        localCurrencyOption,
        composeTransaction,
    } = useSendFormContext();

    const inputName = `outputs[${outputId}].fiat`;
    const currencyInputName = `outputs[${outputId}].currency`;
    const amountInputName = `outputs[${outputId}].amount`;
    const tokenInputName = `outputs[${outputId}].token`;
    const isSetMaxActive = getDefaultValue('setMaxOutputId') === outputId;

    const outputError = errors.outputs ? errors.outputs[outputId] : undefined;
    const error = outputError ? outputError.fiat : undefined;
    const fiatValue = getDefaultValue(inputName, outputs[outputId].fiat || '');
    const tokenValue = getDefaultValue(tokenInputName, outputs[outputId].token);
    const currencyValue =
        getDefaultValue(tokenInputName, outputs[outputId].currency) || localCurrencyOption;
    const token = findToken(account.tokens, tokenValue);
    const decimals = token ? token.decimals : network.decimals;

    return (
        <Wrapper>
            <Input
                state={getInputState(error, fiatValue)}
                monospace
                onChange={event => {
                    if (isSetMaxActive) {
                        setValue('setMaxOutputId', undefined);
                    }
                    if (error) {
                        // reset Amount field in case of invalid Fiat value
                        if (getDefaultValue(amountInputName, '').length > 0) {
                            setValue(amountInputName, '');
                            composeTransaction(amountInputName, true);
                        }
                        return;
                    }
                    // calculate new Amount, Fiat input times currency rate
                    const amount =
                        fiatRates && fiatRates.current && currencyValue
                            ? fromFiatCurrency(
                                  event.target.value,
                                  currencyValue.value,
                                  fiatRates.current.rates,
                                  decimals,
                              )
                            : null;
                    if (amount) {
                        // set Amount value
                        setValue(amountInputName, amount, {
                            shouldValidate: true,
                        });
                        composeTransaction(amountInputName);
                    }
                }}
                name={inputName}
                data-test={inputName}
                defaultValue={fiatValue}
                innerRef={register({
                    required: 'AMOUNT_IS_NOT_SET',
                    validate: (value: string) => {
                        const amountBig = new BigNumber(value);
                        if (amountBig.isNaN()) {
                            return 'AMOUNT_IS_NOT_NUMBER';
                        }
                        if (amountBig.lt(0)) {
                            return 'AMOUNT_IS_TOO_LOW';
                        }
                    },
                })}
                bottomText={<InputError error={error} />}
                innerAddon={
                    <Controller
                        control={control}
                        name={currencyInputName}
                        data-test={currencyInputName}
                        defaultValue={currencyValue}
                        render={({ onChange, value }) => {
                            return (
                                <SelectInput
                                    options={buildCurrencyOptions()}
                                    isSearchable
                                    value={value}
                                    isClearable={false}
                                    minWidth="45px"
                                    onChange={(selected: CurrencyOption) => {
                                        // propagate changes to FormState
                                        onChange(selected);
                                        // calculate Amount value
                                        const rate = getFiatRate(fiatRates, selected.value);
                                        const amountValue = new BigNumber(
                                            getDefaultValue(amountInputName, ''),
                                        );
                                        if (rate && amountValue && !amountValue.isNaN()) {
                                            const fiatValueBigNumber = amountValue.multipliedBy(
                                                rate,
                                            );
                                            setValue(inputName, fiatValueBigNumber.toFixed(2), {
                                                shouldValidate: true,
                                            });
                                        }
                                    }}
                                />
                            );
                        }}
                    />
                }
            />
        </Wrapper>
    );
};
