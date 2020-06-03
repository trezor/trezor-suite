import { Translation } from '@suite-components';
import { Select } from '@trezor/components';
import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
    min-width: 90px;
`;

const StyledSelect = styled(Select)``;

const options = [{ value: 'RECIPIENT', label: <Translation id="TR_RECIPIENT" /> }];

interface ComponentProps {
    addOutput: () => {};
}

const output = {
    id: 1,
    address: '',
    amount: '',
    setMax: false,
    fiatValue: '',
    localCurrency: { value: 'usd', label: 'USD' },
};

export default (props: ComponentProps) => (
    <Wrapper>
        <StyledSelect
            variant="small"
            isSearchable={false}
            isClearable={false}
            value={{ value: 'Add', label: 'Add...' }}
            onChange={(change: { label: string; value: string }) => {
                if (change.value === 'RECIPIENT') {
                    props.addOutput(outputs => [...outputs, output]);
                }
            }}
            options={options}
        />
    </Wrapper>
);
