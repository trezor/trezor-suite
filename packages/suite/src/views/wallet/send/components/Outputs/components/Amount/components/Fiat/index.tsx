import React from 'react';
import styled from 'styled-components';
import { Select, Input } from '@trezor/components';
import { getState } from '@wallet-utils/sendFormUtils';
import { useFormContext } from 'react-hook-form';
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

interface Props {
    outputId: number;
}

export default ({ outputId }: Props) => {
    const { register, errors } = useFormContext();
    const inputName = `local-currency-input-${outputId}`;
    const error = errors[inputName];

    return (
        <Wrapper>
            <Input state={getState(error)} name={inputName} innerRef={register} />
            <SelectWrapper>
                <Select
                    name={`local-currency-select-${outputId}`}
                    innerRef={register}
                    isSearchable
                    isClearable={false}
                    options={FIAT.currencies.map((currency: string) =>
                        getCurrencyOptions(currency),
                    )}
                />
            </SelectWrapper>
        </Wrapper>
    );
};
