import React from 'react';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';
import { Controller } from 'react-hook-form';

import { Input, CleanSelect } from '@trezor/components';
import { InputError } from '@wallet-components';
import { Translation } from '@suite-components';
import { useSendFormContext } from '@wallet-hooks';
import { FIAT } from '@suite-config';
import { fromFiatCurrency } from '@wallet-utils/fiatConverterUtils';
import { getInputState, getFiatRate, findToken } from '@wallet-utils/sendFormUtils';
import { isDecimalsValid } from '@wallet-utils/validation';
import { CurrencyOption } from '@wallet-types/sendForm';
import { MAX_LENGTH } from '@suite-constants/inputs';

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

const Fiat = ({ outputId }: { outputId: number }) => {
    const {
        account,
        network,
        fiatRates,
        register,
        errors,
        clearErrors,
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
        getDefaultValue(currencyInputName, outputs[outputId].currency) || localCurrencyOption;
    const token = findToken(account.tokens, tokenValue);
    const decimals = token ? token.decimals : network.decimals;

    // relation case:
    // Amount input has an error and Fiat has not (but it should)
    // usually this happens after Fiat > Amount recalculation (from here, onChange event)
    // or as a result on composeTransaction process
    const amountError = outputError ? outputError.amount : undefined;
    const errorToDisplay = !error && fiatValue && amountError ? amountError : error;

    return (
        <Wrapper>
            <Input
                state={getInputState(errorToDisplay, fiatValue)}
                monospace
                onChange={event => {
                    if (isSetMaxActive) {
                        setValue('setMaxOutputId', undefined);
                    }
                    if (error) {
                        // reset Amount field in case of invalid Fiat value
                        if (getDefaultValue(amountInputName, '').length > 0) {
                            setValue(amountInputName, '');
                            clearErrors(amountInputName);
                        }
                        composeTransaction(amountInputName);
                        return;
                    }
                    // calculate new Amount, Fiat input times currency rate
                    // NOTE: get fresh values (currencyValue may be outdated)
                    const { value } = getDefaultValue(currencyInputName, localCurrencyOption);
                    const amount =
                        fiatRates && fiatRates.current && value
                            ? fromFiatCurrency(
                                  event.target.value,
                                  value,
                                  fiatRates.current.rates,
                                  decimals,
                              )
                            : null;
                    if (amount) {
                        // set Amount value and validate if
                        setValue(amountInputName, amount, {
                            shouldValidate: true,
                        });
                    }
                    composeTransaction(amountInputName);
                }}
                name={inputName}
                data-test={inputName}
                defaultValue={fiatValue}
                maxLength={MAX_LENGTH.FIAT}
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
                        if (!isDecimalsValid(value, 2)) {
                            return (
                                <Translation
                                    key="AMOUNT_IS_NOT_IN_RANGE_DECIMALS"
                                    id="AMOUNT_IS_NOT_IN_RANGE_DECIMALS"
                                    values={{ decimals: 2 }}
                                />
                            );
                        }
                    },
                })}
                bottomText={<InputError error={errorToDisplay} />}
                innerAddon={
                    <Controller
                        control={control}
                        name={currencyInputName}
                        defaultValue={currencyValue}
                        render={({ onChange, value }) => {
                            return (
                                <CleanSelect
                                    options={buildCurrencyOptions()}
                                    isSearchable
                                    value={value}
                                    isClearable={false}
                                    minWidth="45px"
                                    data-test={currencyInputName}
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
                                            // call compose to store draft, precomposedTx should be the same
                                            composeTransaction(amountInputName);
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

export default Fiat;
