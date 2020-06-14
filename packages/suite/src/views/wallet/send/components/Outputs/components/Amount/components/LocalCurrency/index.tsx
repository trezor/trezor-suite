import React from 'react';
import styled from 'styled-components';
import { Select, Input } from '@trezor/components';
import { useFormContext, Controller } from 'react-hook-form';
import BigNumber from 'bignumber.js';
import { useSendContext } from '@suite/hooks/wallet/useSendContext';
import { FIAT } from '@suite-config';
import { getState } from '@wallet-utils/sendFormUtils';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: row;
    justify-content: flex-start;
`;

const SelectWrapper = styled.div`
    width: 100px;
    min-width: 80px;
    margin-left: 10px;
`;

const getCurrencyOptions = (currency: string) => {
    return { value: currency, label: currency.toUpperCase() };
};

export default ({ outputId }: { outputId: number }) => {
    const { register, errors, getValues, control, setValue } = useFormContext();
    const { fiatRates, token, network, localCurrencyOption } = useSendContext();
    const inputName = `localCurrencyInput-${outputId}`;
    const inputNameSelect = `localCurrencySelect-${outputId}`;
    const error = errors[inputName];
    const decimals = token ? token.decimals : network.decimals;

    return (
        <Wrapper>
            <Input
                state={getState(error)}
                name={inputName}
                innerRef={register}
                onChange={event => {
                    const selectedCurrency = getValues(inputNameSelect);
                    const localCurrencyValue = new BigNumber(event.target.value);
                    if (fiatRates) {
                        const rate = fiatRates.current?.rates[selectedCurrency.value];
                        if (rate) {
                            const amountBigNumber = localCurrencyValue.dividedBy(rate);
                            setValue(`amount-${outputId}`, amountBigNumber.toFixed(decimals));
                        }
                    }
                }}
            />
            <SelectWrapper>
                <Controller
                    as={Select}
                    options={FIAT.currencies.map((currency: string) =>
                        getCurrencyOptions(currency),
                    )}
                    name={inputNameSelect}
                    register={register}
                    isSearchable
                    defaultValue={localCurrencyOption}
                    isClearable={false}
                    onChange={([selected]) => {
                        if (fiatRates) {
                            const rate = fiatRates.current?.rates[selected.value];
                            const amountValue = getValues(`amount-${outputId}`);
                            const amountBig = new BigNumber(amountValue);
                            if (rate && amountValue) {
                                const fiatValueBigNumber = amountBig.multipliedBy(rate);
                                setValue(inputName, fiatValueBigNumber.toFixed(2));
                            }
                        }
                        return { ...selected };
                    }}
                    control={control}
                />
            </SelectWrapper>
        </Wrapper>
    );
};
