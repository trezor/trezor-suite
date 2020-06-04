import React from 'react';
import styled from 'styled-components';
import { Select, Input } from '@trezor/components';
import { Output } from '@wallet-types/sendForm';
import { useFormContext } from 'react-hook-form';
import { DispatchProps } from '../../../../Container';
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
    const { register } = useFormContext();

    return (
        <Wrapper>
            <Input
                // state={props.state}
                name={`local-currency-input-${outputId}`}
                innerRef={register}
            />
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
