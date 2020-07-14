import React from 'react';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';
import { Input, SelectInput } from '@trezor/components';
import { Controller } from 'react-hook-form';
import { useSendFormContext } from '@wallet-hooks';
import { FIAT } from '@suite-config';
import { fromFiatCurrency } from '@wallet-utils/fiatConverterUtils';
import { getInputState, getFiatRate, buildCurrencyOption } from '@wallet-utils/sendFormUtils';
import { CurrencyOption } from '@wallet-types/sendForm';

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
        errors,
        outputs,
        getValues,
        control,
        setValue,
        composeTransaction,
    } = useSendFormContext();

    const inputName = `outputs[${outputId}].fiat`;
    const amountInputName = `outputs[${outputId}].amount`;

    // find related amount error
    const outputError = errors.outputs ? errors.outputs[outputId] : undefined;
    const amountError = outputError ? outputError.amount : undefined;
    // find local error
    const fiatError = outputError ? outputError.fiat : undefined;
    // display error only if there is no related amountError and local error is 'TR_AMOUNT_IS_NOT_SET' (empty field)
    const error =
        amountError && fiatError && fiatError.message === 'TR_AMOUNT_IS_NOT_SET'
            ? undefined
            : fiatError;

    // fiatValue is a "defaultValue" from draft (`outputs` fields) OR regular "onChange" during lifecycle (`getValues` fields)
    // it needs to be done like that, because of `useFieldArray` architecture which requires defaultValue for registered inputs
    const fiatValue = outputs[outputId].fiat || getValues(inputName) || '';
    const decimals = token ? token.decimals : network.decimals;

    return (
        <Wrapper>
            <Input
                state={getInputState(error, fiatValue)}
                monospace
                bottomText={error && error.message}
                onChange={event => {
                    const values = getValues();
                    if (error) {
                        // reset Amount field in case of invalid Fiat value
                        if (values.outputs[outputId].amount.length > 0) {
                            setValue(amountInputName, '', {
                                shouldValidate: true,
                            });
                        }
                        return;
                    }
                    // calculate new Amount, Fiat input times currency rate
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
                        // set Amount value
                        setValue(amountInputName, amount, {
                            shouldValidate: true,
                        });
                        // since Amount will be propagated after useEffect of react-hook-form
                        composeTransaction(outputId, amountInputName);
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
                        control={control}
                        name={`outputs[${outputId}].currency`}
                        defaultValue={localCurrencyOption}
                        render={({ onChange, value }) => {
                            return (
                                <SelectInput
                                    options={FIAT.currencies.map((currency: string) =>
                                        buildCurrencyOption(currency),
                                    )}
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
                                            getValues(amountInputName),
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
