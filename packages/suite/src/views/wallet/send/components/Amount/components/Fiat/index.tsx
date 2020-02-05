import React from 'react';
import styled from 'styled-components';
import { Select, Input } from '@trezor/components-v2';
import { Output } from '@wallet-types/sendForm';
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

const LocalCurrencyInput = styled(Input)``;

interface Props {
    outputId: number;
    value: Output['fiatValue']['value'];
    localCurrency: Output['localCurrency']['value'];
    state: 'error' | undefined;
    sendFormActions: DispatchProps['sendFormActions'];
}

const Fiat = (props: Props) => (
    <Wrapper>
        <LocalCurrencyInput
            state={props.state}
            display="block"
            value={props.value || ''}
            onChange={e =>
                props.sendFormActions.handleFiatInputChange(props.outputId, e.target.value)
            }
        />
        <SelectWrapper>
            <Select
                key="local-currency"
                isSearchable
                display="block"
                isClearable={false}
                onChange={(option: Output['localCurrency']['value']) =>
                    props.sendFormActions.handleSelectCurrencyChange(option, props.outputId)
                }
                value={props.localCurrency}
                options={FIAT.currencies.map((currency: string) => getCurrencyOptions(currency))}
            />
        </SelectWrapper>
    </Wrapper>
);

export default Fiat;
