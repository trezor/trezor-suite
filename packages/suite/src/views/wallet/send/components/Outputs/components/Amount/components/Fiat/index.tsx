import React from 'react';
import styled from 'styled-components';
import { Select, Input } from '@trezor/components';
import { getState } from '@wallet-utils/sendFormUtils';
import { fromFiatCurrency } from '@wallet-utils/fiatConverterUtils';
import { useFormContext } from 'react-hook-form';
import { useSendContext } from '@suite/hooks/wallet/useSendContext';
import { FIAT } from '@suite-config';

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
    const { register, errors, setValue, getValues } = useFormContext();
    const { localCurrencyOption } = useSendContext();
    const inputName = `localCurrencyInput-${outputId}`;
    const inputNameSelect = `localCurrencySelect-${outputId}`;
    const selectValue = getValues(inputNameSelect);
    const error = errors[inputName];

    return (
        <Wrapper>
            <Input
                state={getState(error)}
                name={inputName}
                innerRef={register}
                onChange={() => {
                    // const coinValue = fromFiatCurrency(
                    //     event.target.value,
                    //     getValues(inputNameSelect),
                    //     fiat,
                    //     2
                    // );
                    // console.log('coinValue', coinValue)
                }}
            />
            <SelectWrapper>
                <Select
                    name={inputNameSelect}
                    innerRef={register}
                    isSearchable
                    isClearable={false}
                    onChange={(value: { value: string; label: string }) => {
                        setValue(inputNameSelect, value);
                    }}
                    value={selectValue || localCurrencyOption}
                    options={FIAT.currencies.map((currency: string) =>
                        getCurrencyOptions(currency),
                    )}
                />
            </SelectWrapper>
        </Wrapper>
    );
};
